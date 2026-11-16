<?php

namespace App\Support;

class PdfA4Validator
{
    /**
     * Validate that a PDF binary string is a valid ISO 216 A4 portrait document.
     *
     * @return array{valid: bool, message?: string, width?: float, height?: float}
     */
    public static function validateContent(string $content): array
    {
        if (! str_starts_with($content, '%PDF')) {
            return [
                'valid' => false,
                'message' => 'File is not a valid PDF document.',
            ];
        }

        if (! preg_match('/\/(?:MediaBox|CropBox)\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/', $content, $matches)) {
            return ['valid' => false, 'message' => 'Unable to verify PDF page size.'];
        }

        $x1 = (float) $matches[1];
        $y1 = (float) $matches[2];
        $x2 = (float) $matches[3];
        $y2 = (float) $matches[4];

        $width = abs($x2 - $x1);
        $height = abs($y2 - $y1);

        if ($height <= $width) {
            return [
                'valid' => false,
                'message' => sprintf('Resume PDF must be in portrait orientation (height must exceed width). Got %spt × %spt.', $width, $height),
                'width' => $width,
                'height' => $height,
            ];
        }

        // ISO 216 A4 is 210mm × 297mm = 595.28pt × 841.89pt (±25pt tolerance)
        $isA4Width = abs($width - 595.28) <= 25.0;
        $isA4Height = abs($height - 841.89) <= 25.0;

        if (! $isA4Width || ! $isA4Height) {
            return [
                'valid' => false,
                'message' => sprintf(
                    'Resume PDF must be ISO 216 A4 page size (210 × 297 mm, approx 595 × 842 pt). Detected dimensions: %d × %d pt.',
                    (int) round($width),
                    (int) round($height)
                ),
                'width' => $width,
                'height' => $height,
            ];
        }

        return [
            'valid' => true,
            'width' => $width,
            'height' => $height,
        ];
    }

    /**
     * Validate a PDF file on disk.
     *
     * @return array{valid: bool, message?: string, width?: float, height?: float}
     */
    public static function validateFile(string $filePath): array
    {
        if (! is_file($filePath)) {
            return ['valid' => false, 'message' => 'Unable to verify PDF page size.'];
        }

        $content = @file_get_contents($filePath);
        if ($content === false) {
            return [
                'valid' => false,
                'message' => 'Failed to inspect PDF file.',
            ];
        }

        return self::validateContent($content);
    }
}
