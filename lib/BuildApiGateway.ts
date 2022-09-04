import { Construct } from "constructs"; 
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface IApiGatewayProps {
    projectName: string;
    stageName?: string;
}

export function BuildApiGateway (scope:Construct, props: IApiGatewayProps) : apigateway.RestApi {
        
  const projectName = props.projectName
  const accessLogGroup = new logs.LogGroup(scope, `${projectName}AccessLog`, {
      logGroupName: `${projectName}-api`,
      retention: logs.RetentionDays.ONE_WEEK
    });

  const apiGW = new apigateway.RestApi(scope, `${projectName}Api`, {
      restApiName: `${projectName}-api-gw`,
      cloudWatchRole: true,
      deployOptions: {
        stageName: ( props.stageName != null ? props.stageName : 'dev'),
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

  return apiGW
        
}