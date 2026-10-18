import {
    FOGCATALOG_COMPANY,
    FOGCATALOG_LEGAL_ADDRESS_HTML_EN,
} from "@/lib/legal/fogcatalog-company"

const legalEn = {
    legal: {
        effectiveDateLabel: "Effective date",
        cancellationPolicy: {
            title: "Cancellation & Refund Policy",
            ref: "REF: LEG-REF-2026/V1",
            summary: {
                title: "In Brief",
                items: [
                    "No refunds on purchased subscriptions as it is a digital service.",
                    "You can try the system using our unlimited free plan before deciding.",
                    "You can cancel your subscription anytime without any penalty.",
                    "After cancellation, service continues until the end of the current period — your data is not deleted."
                ]
            },
            warning: "Important Information",
            refundPolicy: {
                title: "1. Refund Policy",
                desc:
                    "FogCatalog provides a digital software service (SaaS) to users. " +
                    "Pursuant to Article 15 of Law No. 6502 and the Distance Contracts " +
                    "Regulation, our service falls under the scope of 'Services performed " +
                    "instantly in electronic environment'. Therefore, there is generally no " +
                    "refund (right of withdrawal) for purchased paid subscriptions " +
                    "(Monthly/Yearly Pro Packages).",
                importantInfo:
                    "To ensure our users can fully experience the system before making a " +
                    "purchasing decision, we offer a duration-unlimited 'Free Package'. " +
                    "Every user can use the system as much as they wish up to 1 Catalog " +
                    "and 50 Products limit without paying any fee and test all features. " +
                    "A user who upgrades to a paid package is deemed to have sufficiently " +
                    "experienced the system and approved the service."
            },
            cancellationProcess: {
                title: "2. Subscription Cancellation Process",
                desc: "You can cancel your subscription at any time without paying any commitment fee or withdrawal penalty.",
                howTo: {
                    title: "How Do I Cancel?",
                    desc:
                        "Simply go to the 'Manage Subscription' tab in your profile " +
                        "settings and click the 'Cancel Package' button."
                },
                rights: {
                    title: "Do I Lose My Usage Rights?",
                    desc:
                        "No. When you cancel, since the payment for that period " +
                        "(relevant month or year) is made in advance, you continue " +
                        "to use Premium features until your subscription period expires."
                },
                expiry: {
                    title: "What Happens When Time Expires?",
                    desc:
                        "When the period expires, the system stops automatic payment " +
                        "withdrawals and your account is automatically downgraded " +
                        "to 'Free Package' status."
                },
                data: {
                    title: "Will My Data Be Deleted?",
                    desc:
                        "Your account is not deleted, but data exceeding the free " +
                        "package limits (1 Catalog / 50 Products) may be passivated " +
                        "or closed for editing."
                }
            },
            exceptions: {
                title: "3. Exceptional Circumstances",
                desc:
                    "In cases where the service cannot be provided at all due to a " +
                    "technical problem caused by FogCatalog or the system remains " +
                    "inaccessible for more than 24 hours (uptime issue), a refund for " +
                    "the relevant period may be evaluated upon request. In such rare " +
                    "cases, you can contact us via info@fogcatalog.com."
            }
        },
        kvkk: {
            title: "KVKK Clarification Text",
            ref: "REF: LEG-KVK-2026/V1",
            summary: {
                title: "In Brief",
                items: [
                    "Explains what data we collect (name, email, IP address) and why we use it.",
                    "Your data is processed only for service delivery, billing, and legal obligations.",
                    "Your data is shared only with payment providers and authorized institutions, never sold.",
                    "Under KVKK Article 11, you can request deletion or correction of your data.",
                    "Contact: info@fogcatalog.com"
                ]
            },
            controller: {
                title: "1. Who is the Data Controller?",
                desc:
                    "Pursuant to the Law on Protection of Personal Data No. 6698 " +
                    "(\"KVKK\"); As Burcu Aldig (hereinafter referred to as \"FogCatalog\" " +
                    "or \"Data Controller\"), we process your personal data within the " +
                    "scope of the purposes explained below."
            },
            processedData: {
                title: "2. Processed Personal Data",
                desc: "Your following data is processed during your membership to our system and use of our services:",
                identity: {
                    label: "Identity Information",
                    items: "Name, surname."
                },
                contact: {
                    label: "Contact Information",
                    items: "Email address, phone number, billing address."
                },
                transaction: {
                    label: "Customer Transaction Information",
                    items: "Order history, package/subscription information, bank/POS transaction reference, request and complaint records. FogCatalog does not process or store the card number, expiry date, CVC or even the last four digits."
                },
                security: {
                    label: "Transaction Security Information",
                    items: "IP address, website login/logout log records, device information."
                }
            },
            purposes: {
                title: "3. Purposes of Processing Personal Data",
                desc: "Your personal data is processed for the following purposes:",
                items: [
                    "Performing membership transactions, ensuring user login.",
                    "Providing SaaS service (creating, managing catalogs).",
                    "Managing billing processes and payment collection.",
                    "Responding to customer support requests.",
                    "Keeping traffic records (logs) pursuant to Law No. 5651 and ensuring information security.",
                    "Fulfilling obligations arising from legal legislation."
                ]
            },
            transfer: {
                title: "4. Transfer of Personal Data",
                desc:
                    "Your personal data may be transferred to the following recipient " +
                    "groups and situations only without seeking your explicit consent:",
                items: [
                    {
                        label: "Legal Obligations:",
                        text: "Authorized public institutions and organizations (e.g. Courts, BTK, Tax Offices)."
                    },
                    {
                        label: "Performance of Service:",
                        text:
                            "Contracted payment institutions (Garanti BBVA virtual POS) and " +
                            "technology providers from whom infrastructure/server service " +
                            "is received to collect payments."
                    }
                ]
            },
            collection: {
                title: "5. Method and Legal Reason for Data Collection",
                desc:
                    "Your data is collected entirely by automatic means during the filling " +
                    "of the membership form via the www.fogcatalog.com website, purchasing " +
                    "a subscription and using the site. This data processing activity is " +
                    "based on the legal reasons specified in Article 5 of KVKK;",
                reasons: [
                    "\"Establishment or performance of a contract\" (Article 5/2-c)",
                    "\"Legitimate interest of the data controller\" (Article 5/2-f)",
                    "\"Explicitly stipulated in laws\" (Article 5/2-a - For log keeping obligation)"
                ],
                footer: "."
            },
            rights: {
                title: "6. Your Rights (KVKK Article 11)",
                desc:
                    "As a data owner, by applying to FogCatalog; you have the right to " +
                    "learn whether your data is processed, to request correction if it is " +
                    "processed incorrectly, to request deletion or destruction of data.",
                contact:
                    "To exercise these rights, you can send your requests in writing " +
                    "to info@fogcatalog.com email address or our company address."
            },
            ui: {
                badge: "DATA PRIVACY PROTOCOL",
                clarification: "CLARIFICATION TEXT",
                updated: "UPDATED:",
                contactTitle: "CONTACT FOR REQUESTS"
            }
        },
        distanceSales: {
            title: "Distance Sales Agreement",
            ref: "REF: LEG-DSA-2026/V1",
            summary: {
                title: "In Brief",
                items: [
                    "FogCatalog is a cloud-based digital catalog software (SaaS).",
                    "As a digital service, it falls under withdrawal right exceptions — no refunds.",
                    "Subscription can be cancelled anytime; usage continues for the remaining period.",
                    "Istanbul Consumer Courts have jurisdiction for disputes."
                ]
            },
            effectiveDateLabel: "Effective Date:",
            effectiveDate: "25.01.2026",
            parties: {
                title: "1. Parties",
                seller: {
                    title: "1.1. Seller (Service Provider)",
                    nameLabel: "Title",
                    name: FOGCATALOG_COMPANY.legalName,
                    taxOfficeLabel: "Tax Office",
                    taxOffice:
                        FOGCATALOG_COMPANY.taxOffice +
                        " / " +
                        FOGCATALOG_COMPANY.taxNumber,
                    emailLabel: "Email",
                    email: FOGCATALOG_COMPANY.email,
                    phoneLabel: "Phone",
                    phone: FOGCATALOG_COMPANY.phone,
                    address: FOGCATALOG_LEGAL_ADDRESS_HTML_EN
                },
                buyer: {
                    title: "1.2. Buyer (Customer)",
                    scope: "Scope",
                    desc:
                        "The real or legal person whose name-surname and invoice " +
                        "information declared while subscribing to the Platform is " +
                        "taken as the basis."
                }
            },
            subject: {
                title: "2. Subject of the Agreement",
                desc:
                    "The subject of this Agreement is the determination of the rights " +
                    "and obligations of the parties regarding the sale, performance and " +
                    "use of the 'Digital Catalog and Product Management Software' (SaaS) " +
                    "service, the qualifications and sales price of which are specified " +
                    "below, ordered electronically by the Buyer via the FogCatalog " +
                    "Platform, in accordance with the Law No. 6502 on the Protection " +
                    "of Consumers and the Regulation on Distance Contracts."
            },
            service: {
                title: "3. Service and Payment Details",
                item1: {
                    label: "3.1. Service Description",
                    desc:
                        "FogCatalog is a cloud-based software service that allows users " +
                        "to create, manage and share product catalogs digitally."
                },
                item2: {
                    label: "3.2. Duration & Renewal",
                    desc:
                        "Service is provided for the period selected by the Buyer " +
                        "(Monthly/Yearly). Unless cancelled, it automatically renews " +
                        "at the current price at the end of the term."
                },
                item3: {
                    label: "3.3. Delivery Method",
                    desc:
                        "The service is of 'Immediate Performance in Electronic " +
                        "Environment' nature. Access authority is defined to the " +
                        "Buyer's account upon payment approval."
                }
            },
            general: {
                title: "4. General Provisions",
                item1:
                    "The Buyer declares that they have read the preliminary information " +
                    "form on the Platform, obtained and confirmed the preliminary " +
                    "information regarding the basic characteristics, sales price, " +
                    "payment method and right of withdrawal.",
                item2:
                    "FogCatalog will show the necessary technical care for the service " +
                    "to be accessible 24/7. However, it cannot be held responsible for " +
                    "access problems due to force majeure or technical maintenance works.",
                item3:
                    "The Buyer is personally responsible for all content uploaded to " +
                    "the system. FogCatalog is not responsible for the content of catalogs " +
                    "created by users and copyright infringements.",
                item4:
                    "The Buyer is responsible for the security of their username and " +
                    "password. FogCatalog cannot be held responsible for damages arising " +
                    "from sharing with third parties or unauthorized use."
            },
            withdrawal: {
                title: "5. Right of Withdrawal (IMPORTANT)",
                item1Part1: "The service subject to this agreement falls within the scope of ",
                item1Strong: "\"Services performed instantly in electronic environment\"",
                item1Part2:
                    " pursuant to Article 15 (ğ) of the Regulation on Distance " +
                    "Contracts titled 'Exceptions to the Right of Withdrawal'.",
                item2Part1:
                    "Therefore, after purchasing the service or renewing the " +
                    "subscription, the Buyer ",
                item2Badge:
                    "CANNOT USE THE RIGHT OF WITHDRAWAL AND CANNOT REQUEST A REFUND.",
                item2Part2:
                    " By approving this agreement, the Buyer accepts in advance " +
                    "that there is no right of withdrawal.",
                item3Label: "Cancellation Procedure:",
                item3Desc: " The Buyer can cancel their subscription at any time via the panel. In case of cancellation:",
                list1: "Service usage continues until the end of the current paid period.",
                list2: "No fee is charged for the next period.",
                list3: "No retrospective refunds are made."
            },
            privacy: {
                title: "6. Privacy & Data Protection",
                desc:
                    "Personal data belonging to the Buyer is processed within the scope " +
                    "of KVKK No. 6698 and FogCatalog Privacy Policy for the purpose of " +
                    "service performance, invoicing and fulfillment of legal obligations. " +
                    "Detailed information is available in the 'Clarification Text' on the Platform."
            },
            jurisdiction: {
                title: "7. Jurisdiction",
                desc:
                    "In disputes arising from this agreement, Consumer Arbitration " +
                    "Committees within the monetary limits, and in exceeding cases:",
                court: "Istanbul Consumer Courts",
                office: "and Enforcement Offices"
            },
            enforcement: {
                title: "8. Enforcement",
                desc:
                    "When the Buyer performs the payment for the order placed via the " +
                    "Platform, they are deemed to have accepted all terms of this agreement."
            },
            footer: {
                page: "PAGE 01 / 01"
            }
        },
        cookiePolicy: {
            title: "Cookie Policy",
            summary: {
                title: "In Brief",
                items: [
                    "Cookies are used for proper site operation and to improve your experience.",
                    "We use mandatory, analytical, and functional cookies.",
                    "You can manage cookies anytime through your browser settings.",
                    "Contact: info@fogcatalog.com"
                ]
            },
            lastUpdated: "Last Updated: January 25, 2026",
            intro:
                "As FogCatalog (Legal Title: Burcu Aldig), we use Cookies to ensure " +
                "you benefit from our website most efficiently and to improve your user " +
                "experience. This policy is an integral part of our Clarification Text " +
                "under KVKK No. 6698.",
            whatIsCookie: {
                title: "1. What is a Cookie?",
                desc:
                    "Cookies are small text files saved to your computer or mobile device " +
                    "via your browser by the websites you visit. Thanks to these files, " +
                    "the site remembers your preferences (e.g. login status, language " +
                    "selection) and recognizes you on your next visit."
            },
            types: {
                title: "2. Types of Cookies We Use",
                mandatory: {
                    label: "Mandatory Cookies",
                    desc:
                        "Technically mandatory for the site to work properly, for you " +
                        "to log in to your membership account and for your security " +
                        "(CSRF protection, etc.). These cookies are not used for marketing " +
                        "purposes and cannot be turned off from our systems."
                },
                analytic: {
                    label: "Analytical Cookies",
                    desc:
                        "Helps us measure our performance and improve our site by " +
                        "collecting anonymous data such as how many people visit our " +
                        "site and which pages are visited most (e.g. Google Analytics)."
                },
                functional: {
                    label: "Functional Cookies",
                    desc:
                        "Allows us to offer you a more personalized experience by saving " +
                        "your preferences such as language selection or 'Remember Me'."
                }
            },
            management: {
                title: "3. How Can You Manage Cookies?",
                desc:
                    "You can delete or block cookies at any time using your browser " +
                    "settings. However, we would like to remind you that when you delete " +
                    "mandatory cookies, the basic functions of the site such as 'Log In' " +
                    "and 'Edit Catalog' may not work.",
                instruction: "You can change your browser settings from these menus:",
                browsers: [
                    { name: "Google Chrome", path: "Settings > Privacy and Security > Cookies" },
                    { name: "Mozilla Firefox", path: "Options > Privacy and Security > Cookies" },
                    { name: "Safari", path: "Preferences > Privacy" },
                    { name: "Microsoft Edge", path: "Settings > Cookies and Site Permissions" }
                ]
            },
            contact: {
                title: "4. Contact",
                desc: "You can send any questions and opinions regarding our cookie policy to info@fogcatalog.com."
            },
            ui: {
                policy: "POLICY",
                userFocused: "User Focused",
                securityDesc: "We prioritize your privacy and data security above all else.",
                definition: "Definition",
                catalog: "CATALOG",
                controls: "Controls",
                inquiries: "Inquiries"
            }
        }
    },
} as const

export default legalEn
