package com.edugestion.servlet;

import com.edugestion.dao.InvoiceDAO;
import com.edugestion.model.Invoice;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.List;

@WebServlet("/InvoiceServlet")
@MultipartConfig(maxFileSize = 5 * 1024 * 1024)
public class InvoiceServlet extends HttpServlet {

    // GET ?order=X → sirve el PDF de la primera factura de esa orden
    // GET          → lista JSON de facturas del usuario en sesión
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        int idUser = (int) session.getAttribute("usuarioId");

        try {
            InvoiceDAO dao = new InvoiceDAO();
            String orderParam = request.getParameter("order");

            if (orderParam != null) {
                // Servir PDF de la factura asociada a la orden
                List<Invoice> invoices = dao.findByOrder(Integer.parseInt(orderParam));
                if (invoices.isEmpty() || invoices.get(0).getPdfFile() == null) {
                    response.sendError(HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
                byte[] pdf = invoices.get(0).getPdfFile();
                response.setContentType("application/pdf");
                response.setContentLength(pdf.length);
                response.getOutputStream().write(pdf);
                return;
            }

            // Sin parámetro → lista JSON de facturas del usuario
            response.setContentType("application/json;charset=UTF-8");
            List<Invoice> invoices = dao.findByUser(idUser);
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");

            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < invoices.size(); i++) {
                Invoice inv = invoices.get(i);
                String dateStr = inv.getDate() != null ? sdf.format(inv.getDate()) : "";
                json.append("{")
                    .append("\"codeInvoice\":").append(inv.getCodeInvoice()).append(",")
                    .append("\"date\":\"").append(dateStr).append("\",")
                    .append("\"totalAmount\":").append(inv.getTotalAmount()).append(",")
                    .append("\"codeOrder\":").append(inv.getCodeOrder()).append(",")
                    .append("\"hasPdf\":").append(inv.getPdfFile() != null && inv.getPdfFile().length > 0)
                    .append("}");
                if (i < invoices.size() - 1) json.append(",");
            }
            json.append("]");
            response.getWriter().write(json.toString());

        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // POST → subir nueva factura (multipart: codeOrder, totalAmount, factura PDF)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            int codeOrder          = Integer.parseInt(request.getParameter("codeOrder"));
            String totalAmountStr  = request.getParameter("totalAmount").replace(",", ".");
            BigDecimal totalAmount = new BigDecimal(totalAmountStr);

            Part pdfPart  = request.getPart("factura");
            byte[] pdfBytes = (pdfPart != null && pdfPart.getSize() > 0)
                    ? pdfPart.getInputStream().readAllBytes()
                    : null;

            Invoice invoice = new Invoice();
            invoice.setDate(new Timestamp(System.currentTimeMillis()));
            invoice.setTotalAmount(totalAmount);
            invoice.setPdfFile(pdfBytes);
            invoice.setCodeOrder(codeOrder);

            new InvoiceDAO().uploadInvoice(invoice);
            response.getWriter().write("{\"ok\":true}");

        } catch (NumberFormatException e) {
            json(response, false, "Datos del formulario incorrectos.");
        } catch (SQLException e) {
            e.printStackTrace();
            json(response, false, "Error de base de datos: " + esc(e.getMessage()));
        }
    }

    // DELETE ?codeInvoice=X → eliminar factura
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            int codeInvoice = Integer.parseInt(request.getParameter("codeInvoice"));
            new InvoiceDAO().deleteInvoice(codeInvoice);
            response.getWriter().write("{\"ok\":true}");

        } catch (NumberFormatException e) {
            json(response, false, "Parámetro incorrecto.");
        } catch (SQLException e) {
            e.printStackTrace();
            json(response, false, "Error de base de datos: " + esc(e.getMessage()));
        }
    }

    private void json(HttpServletResponse response, boolean ok, String msg) throws IOException {
        response.getWriter().write("{\"ok\":" + ok + ",\"error\":\"" + esc(msg) + "\"}");
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
