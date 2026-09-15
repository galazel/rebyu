package com.capstone.rebyu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${aws.s3.access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key}")
    private String secretKey;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * Blank for AWS S3. Set for an S3-compatible store such as Cloudflare R2
     * ({@code https://<account-id>.r2.cloudflarestorage.com}); keys stay the same
     * shape, only where requests go changes.
     */
    @Value("${aws.s3.endpoint:}")
    private String endpoint;

    private StaticCredentialsProvider credentials() {
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
    }

    private boolean customEndpoint() {
        return endpoint != null && !endpoint.isBlank();
    }

    /* Path-style (endpoint/bucket/key) rather than bucket-as-subdomain, which is
       what S3-compatible stores reliably accept, for signed URLs included. */
    private static S3Configuration pathStyle() {
        return S3Configuration.builder().pathStyleAccessEnabled(true).build();
    }

    @Bean
    public S3Client s3Client() {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials());
        if (customEndpoint()) {
            builder.endpointOverride(URI.create(endpoint.trim()))
                    .serviceConfiguration(pathStyle());
        }
        return builder.build();
    }

    /** Used to mint short-lived presigned GET URLs so private files are never served via a public key. */
    @Bean
    public S3Presigner s3Presigner() {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials());
        if (customEndpoint()) {
            builder.endpointOverride(URI.create(endpoint.trim()))
                    .serviceConfiguration(pathStyle());
        }
        return builder.build();
    }
}
