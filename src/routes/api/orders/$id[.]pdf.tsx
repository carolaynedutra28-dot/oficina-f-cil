import { createFileRoute } from "@tanstack/react-router";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getOrder, getCustomer, getSettings } from "@/lib/workshop.server";
import { requireUnlocked } from "@/lib/gate.functions";

export const Route = createFileRoute("/api/orders/$id/pdf")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        await requireUnlocked();
        const orderId = (params as Record<string, string>)["id.pdf"]?.split(".")[0] ?? "";
        const order = await getOrder(orderId);
        if (!order) {
          return new Response("Ordem não encontrada", { status: 404 });
        }

        const [customer, settings] = await Promise.all([getCustomer(order.customer_id), getSettings()]);

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const margin = 40;
        let y = height - margin;

        function text(x: number, value: string, options?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> }) {
          const size = options?.size ?? 10;
          const f = options?.bold ? fontBold : font;
          page.drawText(value, { x, y, size, font: f, color: options?.color ?? rgb(0.1, 0.1, 0.1) });
        }

        function line(value: string, label?: string, options?: { size?: number; bold?: boolean }) {
          if (label) text(margin, `${label}: ${value}`, options);
          else text(margin, value, options);
          y -= (options?.size ?? 10) + 6;
        }

        text(margin, settings?.name ?? "Oficina Mecânica", { size: 18, bold: true });
        y -= 24;
        if (settings?.document) line(settings.document, "CNPJ/CPF");
        if (settings?.phone) line(settings.phone, "Telefone");
        if (settings?.address) line(settings.address, "Endereço");
        y -= 10;

        text(margin, order.number, { size: 16, bold: true });
        y -= 20;
        line(new Date(order.created_at).toLocaleDateString("pt-BR"), "Data");
        line(customer?.name ?? "—", "Cliente");
        if (customer?.phone) line(customer.phone, "Telefone");
        if (customer?.document) line(customer.document, "Documento");
        y -= 10;

        text(margin, "Serviço", { size: 12, bold: true });
        y -= 16;
        line(order.description || "Não informado");
        line(
          Number(order.labor_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          "Mão de obra"
        );
        y -= 10;

        text(margin, "Itens", { size: 12, bold: true });
        y -= 16;

        // Table header
        const colX = [margin, margin + 220, margin + 280, margin + 350, margin + 430];
        text(colX[0], "Descrição", { bold: true });
        text(colX[1], "Qtd", { bold: true });
        text(colX[2], "Unit.", { bold: true });
        text(colX[3], "Total", { bold: true });
        y -= 16;

        for (const item of order.items) {
          text(colX[0], item.description);
          text(colX[1], item.quantity.toString());
          text(
            colX[2],
            Number(item.unit_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          );
          text(
            colX[3],
            (item.quantity * Number(item.unit_price)).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          );
          y -= 14;
        }

        y -= 10;
        page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        y -= 20;
        text(width - margin, "Total: " + Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), {
          size: 14,
          bold: true,
        });

        const pdfBytes = await pdfDoc.save();
        const buffer = Buffer.from(pdfBytes);
        return new Response(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${order.number}.pdf"`,
          },
        });
      },
    },
  },
});
