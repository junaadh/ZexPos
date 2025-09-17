import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ReceiptViewerWrapper from "@/components/receipt-viewer-wrapper";

interface ReceiptPageProps {
    params: {
        id: string;
    };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
    const { user } = await getCurrentUser();

    if (!user) {
        notFound();
    }

    const { id: receiptId } = await params;

    return <ReceiptViewerWrapper receiptId={receiptId} user={user} />;
}
