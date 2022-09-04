import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export interface IRoute53Props {
    projectName: string
    zoneName: string
    publicZone: boolean | true
    Vpc?: ec2.IVpc
}

export class Route53Stack extends cdk.Stack{

    constructor(scope: Construct, id: string, options:IRoute53Props, props?: cdk.StackProps) {
        super(scope, id, props);
        
        const { projectName, zoneName, publicZone, Vpc } = options

        if (publicZone) {
            const zone = new route53.PublicHostedZone(this, `${projectName}HostedZone`, {
                zoneName: zoneName
            }   
            )
    
        } else {
            if (Vpc){
                const zone = new route53.PrivateHostedZone(this, `${projectName}PrivateZone`, {
                    zoneName: zoneName,
                    vpc: Vpc
                })
            }
        }
        // Record追加はこれをご参照
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53-readme.html
    }
}
