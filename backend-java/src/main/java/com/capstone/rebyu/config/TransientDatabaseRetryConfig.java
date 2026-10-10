package com.capstone.rebyu.config;

import lombok.extern.slf4j.Slf4j;
import org.aopalliance.intercept.MethodInterceptor;
import org.springframework.aop.Advisor;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.aop.support.annotation.AnnotationMatchingPointcut;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Role;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.sql.SQLTransientConnectionException;

/**
 * Retries a GET request once when its database connection was dropped.
 *
 * Supabase's pooler occasionally closes a live connection, sometimes in the middle
 * of a query (EOFException, SQLSTATE 08006, then "Connection is closed" on the
 * rollback). The pool settings make that rare; this makes it invisible to the
 * reader. Open-session-in-view is off, so every service call runs its own
 * transaction, and the retry gets a fresh transaction on a fresh connection.
 *
 * GET only: a read is safe to repeat, while repeating a write that failed part-way
 * could apply it twice.
 *
 * Registered as an infrastructure advisor, which is what Spring Boot's auto-proxy
 * creator applies when AspectJ is not on the classpath.
 */
@Slf4j
@Configuration(proxyBeanMethods = false)
public class TransientDatabaseRetryConfig {

    private static final long RETRY_DELAY_MS = 250;

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    public static Advisor transientDatabaseRetryAdvisor() {
        MethodInterceptor retryOnce = invocation -> {
            try {
                return invocation.proceed();
            } catch (Exception first) {
                if (!isDroppedConnection(first)) throw first;
                log.warn("Database connection dropped during {}.{}; retrying once: {}",
                        invocation.getMethod().getDeclaringClass().getSimpleName(),
                        invocation.getMethod().getName(), rootMessage(first));
                Thread.sleep(RETRY_DELAY_MS);
                return invocation.proceed();
            }
        };
        return new DefaultPointcutAdvisor(
                new AnnotationMatchingPointcut(RestController.class, GetMapping.class, true),
                retryOnce);
    }

    /**
     * Logs how many controllers carry the retry, so a missing auto-proxy creator --
     * which would leave the retry silently inactive -- shows up at startup.
     */
    @Bean
    public org.springframework.context.ApplicationListener<org.springframework.boot.context.event.ApplicationReadyEvent>
    transientDatabaseRetryReport() {
        return event -> {
            var context = event.getApplicationContext();
            String[] names = context.getBeanNamesForAnnotation(RestController.class);
            long advised = java.util.Arrays.stream(names)
                    .map(context::getBean)
                    .filter(bean -> bean instanceof org.springframework.aop.framework.Advised proxy
                            && java.util.Arrays.stream(proxy.getAdvisors())
                                    .anyMatch(a -> a.getAdvice() instanceof MethodInterceptor
                                            && a instanceof DefaultPointcutAdvisor p
                                            && p.getPointcut() instanceof AnnotationMatchingPointcut))
                    .count();
            if (advised == 0) {
                log.warn("Transient database retry is NOT active: no controller was proxied");
            } else {
                log.info("Transient database retry active on {} of {} controllers", advised, names.length);
            }
        };
    }

    /** True when any cause is a lost connection rather than a query or data error. */
    static boolean isDroppedConnection(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLTransientConnectionException
                    || cause instanceof java.io.EOFException
                    || cause instanceof java.net.SocketException
                    || cause instanceof org.hibernate.exception.JDBCConnectionException
                    || cause instanceof org.springframework.dao.DataAccessResourceFailureException
                    || cause instanceof org.springframework.transaction.CannotCreateTransactionException) {
                return true;
            }
            if (cause instanceof SQLException sql && sql.getSQLState() != null
                    && sql.getSQLState().startsWith("08")) {
                return true;
            }
            if (cause instanceof SQLException && "Connection is closed".equals(cause.getMessage())) {
                return true;
            }
            if (cause.getCause() == cause) break;
        }
        return false;
    }

    private static String rootMessage(Throwable error) {
        Throwable root = error;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        return root.getClass().getSimpleName() + ": " + root.getMessage();
    }
}
