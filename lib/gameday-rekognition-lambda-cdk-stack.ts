import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as logs from 'aws-cdk-lib/aws-logs'

export class GamedayRekognitionLambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const path = require('path');
    // https://dev.classmethod.jp/articles/aws-cdk-wafv2-block-ip-example/
    // TODO：WAF使ってIP制御を行う
    // apigateway
    const accessLogGroup = new logs.LogGroup(this, 'RekognitionApiAccessLog', {
      logGroupName: 'gameday-rekognition-api-gw',
      retention: logs.RetentionDays.ONE_WEEK
    });
    const api = new apigateway.RestApi(this, 'RekognitionApi', {
      restApiName: 'gameday-rekognition-api',
      cloudWatchRole: true,
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf()
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, 
        allowMethods: apigateway.Cors.ALL_METHODS, 
        statusCode: 200
      }
    })

    // TODO：authorizerの実装
    // IAM: https://dev.classmethod.jp/articles/api-gateway-iam-authentication-sigv4/
    // lambda: https://blog.i-tale.jp/2021/09/d15/
    // Cognito: https://dev.classmethod.jp/articles/api-gateway-rest-apicognito-user-pool-authorizerlambda-i-tried-building-a-functional-configuration-with-aws-cdk-v2/
    
    
    // lambda
    const lambdaRole = new iam.Role(
      this, "RekognitionLambdaRole", {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
      }
    )
    const fn = new lambda.Function(this, 'RekognitionLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'rekognition-lambda')),
      timeout: cdk.Duration.minutes(15), 
      functionName: 'gameday-rekognition-lambda',
      role: lambdaRole, 
    })

    // Rekogniton API execute 
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRekognitionFullAccess'))
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'))
    
    // Create API
    const imageResource = api.root.addResource('image')
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
