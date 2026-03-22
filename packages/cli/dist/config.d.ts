export interface CliConfig {
    apiKey: string;
    baseUrl: string;
}
interface ConfigFile {
    apiKey?: string;
    baseUrl?: string;
}
/**
 * Write a config object to ~/.okrunitrc.
 */
export declare function writeConfigFile(config: ConfigFile): void;
/**
 * Load the effective configuration by merging sources in priority order:
 *   1. Environment variables (OKRUNIT_API_KEY, OKRUNIT_BASE_URL)
 *   2. Config file (~/.okrunitrc)
 *   3. Defaults
 */
export declare function loadConfig(): CliConfig;
/**
 * Load config and verify an API key is available. Exits with an error
 * message if no API key is configured.
 */
export declare function requireConfig(): CliConfig;
export {};
