
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface IOrigins {
    // projectName: string
    // elb?: elbv2.ILoadBalancerV2
    // s3?: s3.IBucket
    restApi: apigateway.RestApi
    originProps?: {
        connectionAttempts?: number
        connectionTimeout?: cdk.Duration
        customHeaders?: {}
        originShieldRegion?: string
        keepaliveTimeout?: cdk.Duration
        httpPort?: number
        httpsPort?: number
        originPath?: string
        originSslProtocols?: cf.OriginSslPolicy[]
        protocalPolicy?: cf.OriginProtocolPolicy
        readTimeout?: cdk.Duration
    }
}

export function BuildApiOrigin(scope: Construct, props: IOrigins): origins.RestApiOrigin {

    const {restApi, originProps } = props

    // const origin = undefined
    // if (elb) {
    //     const origin = new origins.LoadBalancerV2Origin(elb, originProps)
    //     return origin
    // } else if (s3) {
    //     const origin = new origins.S3Origin(s3, originProps)
    //     return origin
    // } else if (restApi) {
    return new origins.RestApiOrigin(restApi, originProps)
    // return origin
    // // }

    // return origin;
}  
