import serverless from "serverless-http";

import { createServer } from "../../index.js";

export const handler = serverless(createServer());
