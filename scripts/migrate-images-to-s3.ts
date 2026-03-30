import { prisma } from "../src/lib/prisma";
import { s3 } from "../src/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";

async function migrate() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    if (!product.imageUrl) continue;

    // Solo migrar las viejas (/uploads)
    if (!product.imageUrl.startsWith("/uploads")) continue;

    const filename = path.basename(product.imageUrl);
    const localPath = path.resolve("uploads/products", filename);

    if (!fs.existsSync(localPath)) {
      console.log(`❌ No existe: ${localPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);

    const key = `products/${filename}`;

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key,
          Body: fileBuffer,
          ContentType: "image/jpg", // podés mejorar esto
        })
      );

      const newUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: newUrl },
      });

      console.log(` Migrado: ${product.id}`);
    } catch (err) {
      console.error(` Error con ${product.id}`, err);
    }
  }

  console.log("🚀 Migración completa");
}

migrate()
  .catch(console.error)
  .finally(() => process.exit());