#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RekgonitionStack } from '../lib/RekognitionStack';
import { Wafv2Stack } from '../lib/Wafv2Stack';
import { CloudFrontStack } from '../lib/CloudFrontStack';

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
    rateLimit: 100, 
    geoLimit: ['JP'] 
},
{
    env: { region: 'ap-northeast-1' }
})
const wafArn = new Wafv2Stack(app, 'GamedayCfWafv2Stack', { 
    projectName: projectName, 
    resourceType: 'CloudFront', 
    rateLimit: 100, 
    geoLimit: ['JP'] 
},
{
    env: { region: 'ap-northeast-1' }
}
).getAclArn()
new CloudFrontStack(app, 'GamedayApiGWCloudFront',  { 
    projectName:projectName, 
    restApi: apiGW, 
    wafArn: wafArn},
    {
        env: { region: 'ap-northeast-1' }
    }
)


