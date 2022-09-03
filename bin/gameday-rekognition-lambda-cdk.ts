#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GamedayRekognitionLambdaCdkStack } from '../lib/gameday-rekognition-lambda-cdk-stack';

const app = new cdk.App();
new GamedayRekognitionLambdaCdkStack(app, 
    'GamedayRekognitionLambdaCdkStack', 
    'huang-gameday', 
    {
        env: {region: 'ap-northeast-1'}
    }
);