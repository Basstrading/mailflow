import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainVerificationStatus, getDkimStatus } from "@/lib/ses";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entity = await prisma.entity.findUnique({ where: { id } });
  if (!entity || !entity.domain) {
    return NextResponse.json({ error: "Entité ou domaine introuvable" }, { status: 404 });
  }

  try {
    const [verificationStatus, dkimStatus] = await Promise.all([
      getDomainVerificationStatus(entity.domain),
      getDkimStatus(entity.domain),
    ]);

    const isVerified =
      verificationStatus === "Success" &&
      dkimStatus.dkimVerificationStatus === "Success";

    // Update database
    await prisma.entity.update({
      where: { id },
      data: {
        isVerified,
        verificationStatus: isVerified
          ? "VERIFIED"
          : verificationStatus === "Pending"
          ? "PENDING"
          : verificationStatus === "Failed"
          ? "FAILED"
          : "PENDING",
      },
    });

    return NextResponse.json({
      domain: entity.domain,
      verificationStatus,
      dkimVerificationStatus: dkimStatus.dkimVerificationStatus,
      dkimEnabled: dkimStatus.dkimEnabled,
      isVerified,
    });
  } catch (error) {
    console.error("SES check status error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du statut" },
      { status: 500 }
    );
  }
}
