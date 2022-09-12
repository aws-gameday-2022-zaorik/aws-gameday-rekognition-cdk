import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'

export interface ICloudFront {
    projectName: string
}


export class CloudFrontS3Stack extends cdk.Stack {

    constructor(scope: Construct, id: string, cfProps: ICloudFront, props?: cdk.StackProps,) {
        super(scope, id, props);
        const { projectName } = cfProps
        const path = require('path');
        // create a Bucket
        const webBucket = new s3.Bucket(this, `${projectName}WebS3Bucket`, {
            bucketName: `${projectName}-web-s3`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL 
        }
        )
        // S3はOAIを利用し、CloudFrontのみのアクセスを実現
        const webOriginAccessIdentity = new cf.OriginAccessIdentity(this, `${projectName}OriginAccessIdentity`, {
            comment: 'web-distribution-originAccessIdentity',
        })

        const cfAccessPolicy = new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            effect: iam.Effect.ALLOW,
            principals: [
                new iam.CanonicalUserPrincipal(
                    webOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
                ),
            ],
            resources: [`${webBucket.bucketArn}/*`]
        })
        webBucket.addToResourcePolicy(cfAccessPolicy)

        const cfDistribution = new cf.Distribution(this, `${projectName}WebDistribution`, {
            comment: 'website-distribution',
            defaultRootObject: 'index.html',
            errorResponses: [
              {
                ttl: cdk.Duration.seconds(300),
                httpStatus: 403,
                responseHttpStatus: 403,
                responsePagePath: '/error.html',
              },
              {
                ttl: cdk.Duration.seconds(300),
                httpStatus: 404,
                responseHttpStatus: 404,
                responsePagePath: '/error.html',
              },
            ],
            defaultBehavior: {
                allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cf.CachedMethods.CACHE_GET_HEAD,
                cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
                viewerProtocolPolicy:
                    cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                origin: new origins.S3Origin(webBucket, {
                    originAccessIdentity: webOriginAccessIdentity
                }),
            },
            priceClass: cf.PriceClass.PRICE_CLASS_ALL,
        });

        const webDeployment = new s3deploy.BucketDeployment(this, `${projectName}Deployment`, {
            sources: [s3deploy.Source.asset(path.join(__dirname, 'website'))],
            destinationBucket: webBucket,
            distribution: cfDistribution,
            distributionPaths: ['/*']
        })
    }
}
