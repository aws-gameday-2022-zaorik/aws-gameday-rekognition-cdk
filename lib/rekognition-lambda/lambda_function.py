from asyncio.log import logger
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    session = boto3.Session(region_name='ap-northeast-1')
    rekognition = session.client('rekognition')
    
    response = rekognition.detect_labels(Image={
        'S3Object':{
            'Bucket': 'rekognition-console-v4-prod-nrt',
            'Name': 'assets/StaticImageAssets/SampleImages/{}'.format(event['name'])
        }
    },
    MaxLabels=10,
    MinConfidence=80
    )
    
    labels = response['Labels']
    
    return {
        'statusCode': 200,
        'body': json.dumps(labels)
    }
