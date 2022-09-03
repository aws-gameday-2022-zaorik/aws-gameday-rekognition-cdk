import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs';


export class GamedayRekognitionLambdaCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, projectName: string, props?: cdk.StackProps ) {
      super(scope, id, props);
    }
}