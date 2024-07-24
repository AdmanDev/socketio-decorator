import { Metadata } from "./types/metadata"

const ioMethodsMetadata: Metadata[] = []

/**
 * Adds metadata to the global metadata array
 * @param {Metadata} metadata The metadata to add
 */
export function addMetadata (metadata: Metadata) {
	ioMethodsMetadata.push(metadata)
}

/**
 * Gets the global metadata array
 * @returns {Metadata[]} The global metadata array
 */
export function getAllMetadata (): Metadata[] {
	return [...ioMethodsMetadata]
}