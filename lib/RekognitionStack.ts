import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import { BuildApiGateway } from './BuildApiGateway';

export class RekgonitionStack extends cdk.Stack {
  public apiGW: apigateway.IRestApi
  public resourceArn: string
  
  constructor(scope: Construct, id: string, projectName: string, props?: cdk.StackProps, stageName?:string ) {
    super(scope, id, props);
    
    const path = require('path');
    // apigateway
    this.apiGW = BuildApiGateway(this, { projectName: projectName, stageName: stageName });
    this.resourceArn = `arn:aws:apigateway:ap-northeast-1::/restapis/${this.apiGW.restApiId}/stages/${ stageName ? stageName : 'dev' }`;
    // BuildWaf(this, { projectName: projectName, resourceType: 'ApiGateway', resourceArn: resourceArn, rateLimit: 100, geoLimit: ['JP']})

    // authorizerの実装
    // IAM: https://dev.classmethod.jp/articles/api-gateway-iam-authentication-sigv4/
    // lambda: https://blog.i-tale.jp/2021/09/d15/
    //        https://speakerdeck.com/shiraishi3/yusukesudexue-bu-api-gateway-plus-lambda-authorizer-shi-jian-ru-men-cdk?slide=25
    // Cognito: https://dev.classmethod.jp/articles/api-gateway-rest-apicognito-user-pool-authorizerlambda-i-tried-building-a-functional-configuration-with-aws-cdk-v2/
    

    const lambdaRole = new iam.Role(
      this, "RekognitionLambdaRole", {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `${projectName}-rekognition-lambda-role`
      }
    )
    const fn = new lambda.Function(this, 'RekognitionLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'rekognition-lambda')),
      timeout: cdk.Duration.minutes(15), 
      functionName: `${projectName}-rekognition-lambda`,
      role: lambdaRole, 
    })

    // Rekogniton API execute 
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRekognitionFullAccess'))
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'))
    
    // Create API
    const imageResource = this.apiGW.root.addResource('image')
    imageResource.addMethod('GET', 
      new apigateway.LambdaIntegration(
        fn,
        {passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
          proxy: false,
          requestTemplates: {"application/json" : "{ \"name\": \"$input.params('name')\"}"},
          integrationResponses: [
            {
              statusCode: '200',
            }
          ]
      }),
      {
        requestParameters: {
          'method.request.querystring.name': true
        },
        methodResponses: [{ statusCode: '200' }],
      }    
    )
  }
}
