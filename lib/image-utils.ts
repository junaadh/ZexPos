// =============================================================================
// IMAGE UTILITIES
// =============================================================================
// Helper functions for image handling and placeholders

/**
 * Gets the appropriate image URL with fallback to placeholder
 */
export function getImageUrl(imageUrl?: string | null): string {
    if (!imageUrl || imageUrl.trim() === '') {
        return '/placeholder.svg'
    }

    // If it's a full URL, return as is
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
        return imageUrl
    }

    // If it's a relative path, ensure it starts with /
    return `/${imageUrl}`
}

/**
 * Handles image load errors by setting placeholder
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
    const target = event.target as HTMLImageElement
    if (target.src !== '/placeholder.svg') {
        target.src = '/placeholder.svg'
    }
}

/**
 * Validates if an image URL is accessible
 */
export function validateImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
    })
}

/**
 * Creates a blob URL for preview purposes
 */
export function createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
}

/**
 * Cleans up blob URLs to prevent memory leaks
 */
export function cleanupPreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
    }
}

/**
 * Validates file type for image uploads
 */
export function isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    return validTypes.includes(file.type)
}

/**
 * Validates file size (max 5MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxBytes
}

/**
 * Image upload validation
 */
export function validateImageUpload(file: File): { isValid: boolean; error?: string } {
    if (!isValidImageFile(file)) {
        return {
            isValid: false,
            error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
        }
    }

    if (!isValidFileSize(file)) {
        return {
            isValid: false,
            error: 'File size must be less than 5MB'
        }
    }

    return { isValid: true }
}
