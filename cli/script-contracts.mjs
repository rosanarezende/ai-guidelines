#!/usr/bin/env node
import { main } from "./governance/script-contracts.mjs";

process.exit(await main(process.argv.slice(2)));
