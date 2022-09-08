#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RekgonitionStack } from '../lib/RekognitionStack';
import { Wafv2Stack } from '../lib/Wafv2Stack';
import { CloudFrontStack } from '../lib/CloudFrontStack';
import { CloudFrontElbStack } from '../lib/CloudFrontELbStack';

const app = new cdk.App();
const projectName = 'huang-gameday'
const { apiGW, resourceArn } = new RekgonitionStack(app,
    'GamedayRekognitionStack',
    projectName,
    {
        env: { region: 'ap-northeast-1' }
    }
);
new Wafv2Stack(app, 'GamedayWafv2Stack', { 
    projectName: projectName, 
    resourceType: 'ApiGateway', 
    resourceArn: resourceArn,
},
{
    env: { region: 'ap-northeast-1' }
})
new Wafv2Stack(app, 'GamedayCfWafv2Stack', { 
    projectName: projectName, 
    resourceType: 'CloudFront', 
    rateLimit: 100, 
    geoLimit: ['US'] 
},
{
    env: { region: 'us-east-1' } //https://dev.classmethod.jp/articles/cloudformation-webacl-cloudfront-error/#toc-4
}
)
// ).getAclArn()
// new CloudFrontStack(app, 'GamedayCloudFrontStack',  { projectName:projectName, restApi: apiGW},
// {
//     env: { region: 'ap-northeast-1' }
// }
// )

new CloudFrontElbStack(app, 'GamedayCloudFrontElbStack', { 
    projectName: projectName, 
    elbArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-load-balancer/1234567890123456'
},
{
    env: { 
        account: '123456789012',
        region: 'us-east-1' 
    }
}
)
