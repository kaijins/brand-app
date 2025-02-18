// utils/bulkUpload.ts
import { saveLogo } from './logoDatabase';

interface BulkLogoData {
    brandName: string;
    imagePath: string;
}

export async function bulkUploadLogos(logoDataList: BulkLogoData[]) {
    const failedUploads: string[] = [];

    for (const logoData of logoDataList) {
        try {
            const response = await fetch(logoData.imagePath);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            await saveLogo({
                id: Date.now().toString(),
                brandName: logoData.brandName,
                brandCode: logoData.brandName,  // ブランド名をそのままコードとして使用
                imageData: base64,
                uploadDate: new Date().toISOString()
            });

        } catch (error) {
            console.error(`Failed to upload ${logoData.brandName}:`, error);
            failedUploads.push(logoData.brandName);
        }
    }

    return {
        success: logoDataList.length - failedUploads.length,
        failed: failedUploads
    };
}