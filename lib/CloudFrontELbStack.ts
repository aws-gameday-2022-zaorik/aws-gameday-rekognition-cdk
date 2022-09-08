import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { BuildOrigin } from './BuildOrigin';
import { BuildElbOrigin } from './BuildElbOrigin';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface ICloudFront {
    projectName: string, 
    elbArn: string,
}


export class CloudFrontElbStack extends cdk.Stack {

    constructor(scope: Construct, id: string, cfProps:ICloudFront, props?: cdk.StackProps, ) {
        super(scope, id, props);
        
        const { projectName, elbArn } = cfProps
        const cfLogBucket = new s3.Bucket(this, `${projectName}CfLogBucket`, { bucketName: `${projectName}-cf-log-bucket`}) 
        
        const elb = elbv2.ApplicationLoadBalancer.fromLookup(this, 'ALB', {
            loadBalancerArn: elbArn,
          });
        const elbOrigin = BuildElbOrigin(this, {
            elb: elb,
        }
        )
        // const apiOrigin = BuildOrigin(scope, { 
        //     // projectName: projectName, 
        //     restApi: restApi, 
        //     originProps: { 
        //         customHeaders: {
        //             Hoge: 'Hogo'
        //             }
        //         }
        //     }
        // )
        // } else if (elb) {
        //     const elbOrigin = BuildOrigin(scope, { projectName: projectName, elb: elb })
        // } else if (s3) {
        //     const s3Origin = BuildOrigin(scope, { projectName: projectName, s3: s3})
        // }
        
        // S3 Distribution: https://dev.classmethod.jp/articles/i-tried-building-cloudfronts3-static-site-hosting-with-aws-cdk-v2/
        
        // オリジングループを作成し、プライマリ・セカンダリオリジンを指定
        // • フェイルオーバー基準: オリジンがフェイルオーバー⽤に設定した 500, 502, 503 等の HTTP ステータスコードを返した場合や、接続タイムアウト/接続試⾏回数を超過/応
        // 答タイムアウトした場合にバックアップオリジンにルーティング
        // • Lambda@Edge 関数やカスタムエラーページでもオリジンフェイルオーバーが可能

        new cf.Distribution(this, `${projectName}Distribution`, {
            defaultBehavior: { 
                origin: elbOrigin,
                allowedMethods: cf.AllowedMethods.ALLOW_ALL, // AllOW_MEHOD
                cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
                viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.OriginRequestPolicy.html
                originRequestPolicy: new cf.OriginRequestPolicy(this, `${projectName}OriginRequestPolicy`, { 
                    originRequestPolicyName: 'apigwPolicy', 
                    queryStringBehavior: cf.OriginRequestQueryStringBehavior.all() } )
            },
            // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.DistributionProps.html
            enableIpv6: true,
            enableLogging: true,
            enabled: true,
            httpVersion: cf.HttpVersion.HTTP2_AND_3,
            logBucket: cfLogBucket,
            minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2019,
            priceClass: cf.PriceClass.PRICE_CLASS_ALL,
            // 同じリージョンのものしか参照できないので
            // webAclId: "arn:aws:wafv2:us-east-1:898207152345:global/webacl/huang-gameday-cloudfront-waf-web-acl/05400594-7d37-4b81-b8c4-1d60a8b0f176"
        }
        )
    }
}