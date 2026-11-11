package com.capstone.rebyu.aigateway.config;

import io.netty.channel.ChannelOption;
import io.netty.resolver.DefaultAddressResolverGroup;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(AiServiceProperties.class)
public class AiServiceClientConfig {

    private static final int MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

    @Bean("aiWebClient")
    public WebClient aiWebClient(AiServiceProperties properties) {
        // The JVM resolver (30 s cache) instead of Netty's own DNS cache: recreating the
        // python-api container gives it a new address, and Netty kept dialling the old one
        // for minutes ("Connection refused: python-api/[old IP]") after it was back up.
        HttpClient httpClient = HttpClient.create()
                .resolver(DefaultAddressResolverGroup.INSTANCE)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, properties.getConnectTimeoutMs())
                .responseTimeout(Duration.ofMillis(properties.getReadTimeoutMs()));

        WebClient.Builder builder = WebClient.builder()
                .baseUrl(properties.getServiceUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(codecs -> codecs.defaultCodecs()
                        .maxInMemorySize(MAX_RESPONSE_BYTES));

        if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
            builder.defaultHeader("X-Service-Key", properties.getApiKey());
        }
        return builder.build();
    }
}
