
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface IOrigins {
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
    return new origins.RestApiOrigin(restApi, originProps)
    
}  
