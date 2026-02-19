export const TOP_TECHNOLOGIES = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "C", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "Scala", "R", "Matlab", "Perl", "Shell", "PowerShell", "Objective-C", "Groovy", "Lua", "Haskell", "Elixir", "Clojure", "F#", "Assembly", "VBA", "Visual Basic",

    // Frontend
    "React", "Angular", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "SvelteKit", "Remix", "Gatsby", "Astro", "SolidJS", "Qwik", "jQuery", "Bootstrap", "Tailwind CSS", "Sass", "Less", "Stylus", "Material UI", "Chakra UI", "Ant Design", "Radix UI", "Shadcn UI", "Emotion", "Styled Components", "Webpack", "Vite", "Rollup", "Parcel", "Babel", "ESLint", "Prettier",

    // Backend & Frameworks
    "Node.js", "Express.js", "NestJS", "Fastify", "Koa", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", "Symfony", "CodeIgniter", "Ruby on Rails", "ASP.NET Core", "Entity Framework", "Hibernate", "Phoenix", "Fiber", "Gin", "Echo",

    // Mobile
    "React Native", "Flutter", "Ionic", "Cordova", "Xamarin", "NativeScript", "Expo", "Android SDK", "iOS SDK", "SwiftUI", "Jetpack Compose",

    // Database
    "PostgreSQL", "MySQL", "MariaDB", "SQLite", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Firestore", "Supabase", "Firebase Realtime Database", "Oracle", "SQL Server", "Cosmos DB", "Elasticsearch", "Neo4j", "CouchDB", "InfluxDB", "TimescaleDB", "PlanetScale", "Neon",

    // Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "DigitalOcean", "Heroku", "Vercel", "Netlify", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI", "ArgoCD", "Prometheus", "Grafana", "ELK Stack", "Datadog", "New Relic", "Sentry", "PagerDuty", "Cloudflare", "Nginx", "Apache", "Linux", "Bash",

    // AI/ML & Data
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "Neural Networks", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "OpenCV", "Hugging Face", "OpenAI API", "LangChain", "LLMs", "Generative AI", "Data Analysis", "Data Science", "Big Data", "Spark", "Hadoop", "Airflow", "dbt", "Snowflake", "Databricks", "Power BI", "Tableau", "Looker",

    // Tools & Platforms
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Trello", "Asana", "Notion", "Slack", "Discord", "Zoom", "Teams", "Figma", "Adobe XD", "Sketch", "InVision", "Zeplin", "Postman", "Insomnia", "Swagger", "Storybook",

    // Testing
    "Jest", "Mocha", "Chai", "Jasmine", "Cypress", "Playwright", "Puppeteer", "Selenium", "JUnit", "TestNG", "PyTest", "RSpec", "XUnit", "NUnit",

    // Security
    "OAuth", "JWT", "Auth0", "Okta", "Keycloak", "Cognito", "Firebase Auth", "OWASP", "Penetration Testing", "Ethical Hacking", "Cryptography",

    // Blockchain
    "Blockchain", "Ethereum", "Solidity", "Web3", "Smart Contracts", "Hardhat", "Truffle", "Ganache", "IPFS",

    // UI/UX & Design
    "User Interface Design", "User Experience Design", "Interaction Design", "Wireframing", "Prototyping", "User Research", "Usability Testing", "Information Architecture", "Design Systems",

    // Expanded Tech Stack
    "Redux", "MobX", "Zustand", "Recoil", "Context API", "RxJS", "NgRx", "Vuex", "Pinia", "Knockout.js", "Backbone.js", "Ember.js", "Meteor.js", "Three.js", "WebGL", "D3.js", "Chart.js", "Highcharts", "Leaflet", "Mapbox", "Cesium", "Fabric.js", "Paper.js", "PixiJS", "Phaser", "Unity", "Unreal Engine", "Godot", "Blender", "Maya", "3ds Max", "Cinema 4D", "ZBrush", "Houdini", "Substance Painter", "Arnold", "V-Ray", "Octane Render", "KeyShot",

    // Mobile & Desktop
    "Electron", "Tauri", "NW.js", "Qt", "GTK", "WPF", "WinForms", "UWP", "MacOS Development", "Cocoa Touch", "UIKit", "AppKit", "WatchKit", "TVOS", "Android Jetpack", "RxJava", "RxSwift", "Objective-C++",

    // Systems & Networking
    "Cuda", "OpenCL", "OpenGL", "Vulkan", "DirectX", "Metal", "TCP/IP", "DNS", "HTTP/HTTPS", "WebSockets", "WebRTC", "gRPC", "MQTT", "AMQP", "RabbitMQ", "Kafka", "ActiveMQ", "ZeroMQ", "NATS", "Redis Pub/Sub", "Socket.io", "SignalR",

    // Cloud & Infra Extended
    "AWS Lambda", "AWS EC2", "AWS S3", "AWS RDS", "AWS DynamoDB", "AWS ECS", "AWS EKS", "AWS CloudFormation", "AWS CloudWatch", "Azure Functions", "Azure App Service", "Azure Blob Storage", "Azure SQL", "Azure DevOps", "Google Cloud Functions", "Google App Engine", "Google Cloud Storage", "Google BigQuery", "Google Kubernetes Engine", "OpenStack", "VMware", "VirtualBox", "Vagrant", "Puppet", "Chef", "SaltStack", "Pulumi", "CloudInit", "Istio", "Linkerd", "Consul", "Vault", "Nomad", "Envoy", "Traefik", "HAProxy",

    // Data Engineering & Science Extended
    "Apache Spark", "Apache Flink", "Apache Storm", "Apache Beam", "Apache Hive", "Apache Pig", "Apache Mahout", "Apache Nifi", "Apache Sqoop", "Apache Flume", "HBase", "Presto", "Trino", "Dremio", "ClickHouse", "Redshift", "BigQuery", "Snowflake", "Data Warehousing", "ETL", "ELT", "Data Lakes", "Delta Lake", "Hudi", "Iceberg", "Airbyte", "Fivetran", "Matillion", "Talend", "Informatica", "PowerCenter", "Alteryx", "QlikView", "Qlik Sense", "Looker Studio", "Superset", "Metabase", "Redash",

    // AI/ML Extended
    "TensorFlow Lite", "TensorFlow.js", "PyTorch Mobile", "ONNX", "KubeFlow", "MLflow", "Weights & Biases", "DVC", "LabelImg", "Roboflow", "YOLO", "R-CNN", "BERT", "GPT", "Stable Diffusion", "Midjourney", "DALL-E", "AutoML", "H2O.ai", "DataRobot", "RapidMiner", "KNIME", "Weka", "Orange",

    // Security Extended
    "CISSP", "CEH", "OSCP", "CISM", "CISA", "Security+", "Network+", "Forensics", "Malware Analysis", "Reverse Engineering", "Wireshark", "Nmap", "Metasploit", "Burp Suite", "Nessus", "Qualys", "Snort", "Suricata", "Zeek", "Splunk", "ArcSight", "QRadar", "Siem", "Soar", "IAM", "PAM", "SSO", "SAML", "OIDC", "MFA", "Zero Trust",

    // Blockchain Extended
    "Bitcoin", "Hyperledger Fabric", "Corda", "Quorum", "Ripple", "Stellar", "EOS", "Tron", "Cardano", "Polkadot", "Solana", "Avalanche", "Near", "Algorand", "Tezos", "Chainlink", "The Graph", "Infura", "Alchemy", "Moralis", "Truffle", "Hardhat", "Brownie", "Remix IDE", "OpenZeppelin",

    // Design & Creative Extended
    "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Adobe Premiere Pro", "Adobe After Effects", "Adobe Audition", "Adobe Lightroom", "CorelDRAW", "Sketch", "Affinity Designer", "Affinity Photo", "GIMP", "Inkscape", "Canva", "Proto.io", "Marvel", "Axure RP", "Balsamiq", "Framer", "Principle", "Lottie", "Rive",

    // Business & Strategy
    "Business Analysis", "Strategic Planning", "Market Research", "Competitive Analysis", "Financial Modeling", "Budgeting", "Forecasting", "Accounting", "Bookkeeping", "GAAP", "IFRS", "QuickBooks", "Xero", "NetSuite", "SAP", "Oracle ERP", "Microsoft Dynamics", "Salesforce CRM", "HubSpot CRM", "Zoho CRM", "Pipedrive", "Zendesk", "Intercom", "Freshdesk", "ServiceNow", "Jira Service Management", "Monday.com", "ClickUp", "Wrike", "Smartsheet", "Airtable", "Basecamp", "Notion", "Evernote", "Slack", "Microsoft Teams", "Zoom", "Google Workspace", "Microsoft 365",

    // Marketing & Growth
    "SEO Audit", "Keyword Research", "On-Page SEO", "Off-Page SEO", "Technical SEO", "Link Building", "Local SEO", "Google Analytics", "Google Tag Manager", "Google Search Console", "Google Ads", "Facebook Ads", "Instagram Ads", "LinkedIn Ads", "Twitter Ads", "TikTok Ads", "Snapchat Ads", "Pinterest Ads", "Programmatic Advertising", "Affiliate Marketing", "Influencer Marketing", "Content Strategy", "Brand Strategy", "Public Relations", "Crisis Management", "Event Planning", "Community Management",

    // Languages (Human)
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Russian", "Portuguese", "Italian", "Arabic", "Hindi", "Bengali", "Punjabi", "Turkish", "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Greek", "Hebrew", "Polish", "Czech", "Hungarian", "Thai", "Vietnamese", "Indonesian", "Malay", "Tagalog",

    // Soft Skills & Business
    "Project Management", "Product Management", "Agile", "Scrum", "Kanban", "Waterfall", "Leadership", "Communication", "Teamwork", "Problem Solving", "Critical Thinking", "Time Management", "Negotation", "Sales", "Marketing", "SEO", "SEM", "Content Marketing", "Email Marketing", "Social Media Marketing", "Copywriting", "Technical Writing", "Customer Success", "Customer Support", "CRM", "HubSpot", "Salesforce"
];

export const SKILL_CATEGORIES = [
    "Languages", "Frontend", "Backend", "Mobile", "Database", "Cloud & DevOps", "AI/ML & Data", "Tools", "Testing", "Security", "Blockchain", "Design", "Business"
];
