package com.capstone.rebyu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import software.amazon.awssdk.auth.credentials.AnonymousCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

@Configuration
public class CognitoClientConfig {

    // GetUser authenticates with the caller's access token, so this client
    // needs no AWS credentials (used to read the signed-in user's attributes).
    // Primary so injection by type resolves to it, not the admin client.
    @Bean
    @Primary
    public CognitoIdentityProviderClient cognitoIdentityProviderClient(
            @Value("${app.cognito.region}") String region
    ) {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(AnonymousCredentialsProvider.create())
                .build();
    }

    // Admin operations (AdminCreateUser to provision approved institution
    // accounts) require real IAM credentials. Deliberately the AWS keys, not
    // aws.s3.*: file storage can point at Cloudflare R2, whose keys AWS rejects.
    @Bean
    public CognitoIdentityProviderClient cognitoAdminClient(
            @Value("${app.cognito.region}") String region,
            @Value("${aws.access-key}") String accessKey,
            @Value("${aws.secret-key}") String secretKey
    ) {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
}
