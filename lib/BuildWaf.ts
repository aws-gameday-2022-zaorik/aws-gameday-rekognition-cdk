import { Construct } from "constructs"; 
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface IWafProps {
    projectName: string;
    resourceType: string;
    resourceArn: string
    rateLimit?: number;
    geoLimit?: string[]
    addresses?: string[];
}

export interface IWafRule {
    name: string;
    priority: number;
    action?: { block?: {}, allow?:{}}
    statement: {
        geoMatchStatement?:{
            countryCodes: string[];
        }
        ipSetReferenceStatement?: {
            arn: string
        }
        rateBasedStatement?: {
            aggregateKeyType: string;
            limit: number;
        }
        managedRuleGroupStatement?: {
            vendorName: string;
            name: string;
        }
    },
    overrideAction?: { none: {} }
    visibilityConfig: {
        cloudWatchMetricsEnabled: boolean;
        sampledRequestsEnabled: boolean;
        metricName: string
    }
}

// https://www.slideshare.net/AmazonWebServicesJapan/202202-aws-black-belt-online-seminar-aws-managed-rules-for-aws-waf
// https://docs.aws.amazon.com/ja_jp/waf/latest/developerguide/aws-managed-rule-groups-list.html
const defaultRules: IWafRule[] = [
    {
        name: "AWSManagedRulesCommonRuleSet",
        priority: 1,
        statement: {
            managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesCommonRuleSet",
        },
    },
        overrideAction: { none: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesCommonRuleSet",
        },
    },
    {
        name: "AWSManagedRulesAdminProtectionRuleSet",
        priority: 2,
        statement: {
            managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesAdminProtectionRuleSet",
            },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesAdminProtectionRuleSet",
        },
    },
    {
        name: "AWSManagedRulesKnownBadInputsRuleSet",
        priority: 3,
        statement: {
            managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesKnownBadInputsRuleSet",
        },
    },
    {
        name: "AWSManagedRulesAmazonIpReputationList",
        priority: 4,
        statement: {
            managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesAmazonIpReputationList",
            },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesAmazonIpReputationList",
        },
    },
    {
        name: "AWSManagedRulesAnonymousIpList",
        priority: 5,
        statement: {
            managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesAnonymousIpList",
            },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesAnonymousIpList",
        },
    },
    {
        name: "AWSManagedRulesBotControlRuleSet",
        priority: 6,
        statement: {
            managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesBotControlRuleSet",
            },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesBotControlRuleSet",
        },
    },

]


export function BuildWaf  (scope:Construct, props:IWafProps) { {
    
    const projectName = props.projectName
    const resourceType = props.resourceType
    const resourceArn = props.resourceArn
    const rateLimit = props.rateLimit
    const geoLimit = props.geoLimit
    const addresses = props.addresses

    var priorityCount: number = 6
    const rules = defaultRules

    if (addresses != null) {

        const wafIPSet = new wafv2.CfnIPSet(scope, `${projectName}WafIPSet`, {
            name: `${projectName}-${resourceType.toLowerCase()}-waf-ip-set`,
            ipAddressVersion: 'IPV4',
            scope: resourceType.toUpperCase() == 'CLOUDFRONT' ? 'CLOUDFRONT' : 'REGIONAL',
            addresses: addresses
        })

        rules.push({
            priority: 1,
            name: 'TestWafWebAclIpSetRule',
            action: { allow: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: `${projectName}-${resourceType.toLowerCase()}-WafWebAclIpSetRule`,
            },
            statement: {
              ipSetReferenceStatement: {
                arn: wafIPSet.attrArn,
              },
            },
          }
        )
        priorityCount += 1; 
    }

    if (rateLimit != null) {
        // ratelimitRule
        // AWS WAF checks the rate of requests every 30 seconds, and counts requests for the prior five minutes each time. 
        // Because of this, it's possible for an IP address to send requests at too high a rate for 30 seconds 
        // before AWS WAF detects and blocks it. AWS WAF can block up to 10,000 IP addresses.
        rules.push({
            name: "rateLimitRule",
            priority: priorityCount,
            action: { block: {} },
            visibilityConfig: {
                metricName: `${projectName}-${resourceType.toLowerCase()}-rateLimitRule`, 
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: false
            },
            statement: {
                rateBasedStatement: {
                    aggregateKeyType: "IP", 
                    limit: rateLimit
                }
            }
        })
        priorityCount += 1;    
    }

    if (geoLimit != null) {
        rules.push ({
            name: `geoLimitrule`,
            priority: 30,
            action: { allow: {} },
            visibilityConfig: {
                metricName: `${projectName}-${resourceType.toLowerCase()}-geoLimitRule`,
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: false
            },
            statement: {
                geoMatchStatement: {
                    countryCodes: geoLimit
                }
            }
        })
    }


    // Defination WebACL
    const webAcl = new wafv2.CfnWebACL(scope, `${projectName}WafAcl`, {
        defaultAction: { allow: {} },
        name: `${projectName}-${resourceType.toLowerCase()}-waf-web-acl`,
        scope: resourceType.toUpperCase() == 'CLOUDFRONT' ? 'CLOUDFRONT' : 'REGIONAL',
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: `${projectName.toLowerCase()}${resourceType.toLowerCase()}-WafWebAcl`,
        },
        rules: rules
        });
    

    new wafv2.CfnWebACLAssociation(scope, 'TestWebAclAssociation', {
        resourceArn: resourceArn,
        webAclArn: webAcl.attrArn
        });
    }
}

// 他使えそうなルールを
// {
//     name: `demo-api-auth-gateway-sqli-rule`,
//     priority: 40,
//     action: { block: {} },
//     visibilityConfig: {
//         metricName: `demo-APIAuthGatewaySqliRule`,
//         cloudWatchMetricsEnabled: true,
//         sampledRequestsEnabled: false
//     },
//     statement: {
//         orStatement: {
//             statements: [{
//                 sqliMatchStatement: {
//                     fieldToMatch: {
//                         allQueryArguments: {}
//                     },
//                     textTransformations: [{
//                         priority: 1,
//                         type: "URL_DECODE"
//                     },
//                     {
//                         priority: 2,
//                         type: "HTML_ENTITY_DECODE"
//                     }]
//                 }
//             },
//             {
//                 sqliMatchStatement: {
//                     fieldToMatch: {
//                         body: {}
//                     },
//                     textTransformations: [{
//                         priority: 1,
//                         type: "URL_DECODE"
//                     },
//                     {
//                         priority: 2,
//                         type: "HTML_ENTITY_DECODE"
//                     }]
//                 }
//             },
//             {
//                 sqliMatchStatement: {
//                     fieldToMatch: {
//                         uriPath: {}
//                     },
//                     textTransformations: [{
//                         priority: 1,
//                         type: "URL_DECODE"
//                     }]
//                 }
//             }]
//         }
//     }
// },
// {
//     name: `demo-detect-xss`,
//     priority: 60,
//     action: { block: {} },
//     visibilityConfig: {
//         metricName: `demo-detect-xss`,
//         cloudWatchMetricsEnabled: true,
//         sampledRequestsEnabled: false
//     },
//     statement: {
//         orStatement: {
//             statements: [
//                 {
//                     xssMatchStatement: {
//                         fieldToMatch: {
//                             uriPath: {}
//                         },
//                         textTransformations: [{
//                             priority: 1,
//                             type: "URL_DECODE"
//                         },
//                         {
//                             priority: 2,
//                             type: "HTML_ENTITY_DECODE"
//                         }]
//                     }
//                 },
//                 {
//                     xssMatchStatement: {
//                         fieldToMatch: {
//                             allQueryArguments: {}
//                         },
//                         textTransformations: [{
//                             priority: 1,
//                             type: "URL_DECODE"
//                         },
//                         {
//                             priority: 2,
//                             type: "HTML_ENTITY_DECODE"
//                         }]
//                     }
//                 },
                
//             ]
//         }
//     }
// }
// ]
// });
 