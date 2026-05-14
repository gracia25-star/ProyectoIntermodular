package com.edugestion.servlet;

import com.edugestion.dao.*;
import com.edugestion.model.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.Year;
import java.util.List;

@WebServlet("/PurchaseOrderServlet")
@MultipartConfig(maxFileSize = 5 * 1024 * 1024)
public class PurchaseOrderServlet extends HttpServlet {

    // ── GET: lista de órdenes del usuario ────────────────────
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        int idUser = (int) session.getAttribute("usuarioId");
        response.setContentType("application/json;charset=UTF-8");

        try {
            List<PurchaseOrder> orders = new PurchaseOrderDAO().findByUser(idUser);
            SupplierDAO supplierDao   = new SupplierDAO();
            InvoiceDAO  invoiceDao    = new InvoiceDAO();
            SimpleDateFormat sdf      = new SimpleDateFormat("dd/MM/yyyy");

            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < orders.size(); i++) {
                PurchaseOrder o = orders.get(i);

                String supplierName = "—";
                if (o.getIdSupplier() != null) {
                    Supplier s = supplierDao.findById(o.getIdSupplier());
                    if (s != null) supplierName = s.getName();
                }

                boolean hasInvoice = !invoiceDao.findByOrder(o.getCodeOrder()).isEmpty();
                String dateStr = o.getDate() != null ? sdf.format(o.getDate()) : "";

                json.append("{")
                    .append("\"codeOrder\":").append(o.getCodeOrder()).append(",")
                    .append("\"orderReference\":\"").append(esc(o.getOrderReference())).append("\",")
                    .append("\"date\":\"").append(dateStr).append("\",")
                    .append("\"supplierName\":\"").append(esc(supplierName)).append("\",")
                    .append("\"amount\":").append(o.getAmount()).append(",")
                    .append("\"status\":\"").append(esc(o.getStatus())).append("\",")
                    .append("\"description\":\"").append(esc(nvl(o.getDescription()))).append("\",")
                    .append("\"comment\":\"").append(esc(nvl(o.getComment()))).append("\",")
                    .append("\"hasInvoice\":").append(hasInvoice)
                    .append("}");

                if (i < orders.size() - 1) json.append(",");
            }
            json.append("]");
            response.getWriter().write(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // ── POST: crear nueva orden ──────────────────────────────
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

        int idUser = (int) session.getAttribute("usuarioId");

        try {
            // Datos del usuario y su departamento
            User user = new UserDAO().findById(idUser);
            if (user == null || user.getCodeDept() == null) {
                json(response, false, "Tu usuario no tiene departamento asignado.");
                return;
            }
            int codeDept = user.getCodeDept();

            // Parámetros del formulario
            boolean esPlanInversion = "true".equals(request.getParameter("esPlanInversion"));
            String  codigoManual    = nvl(request.getParameter("codigoManual")).trim();
            String  tipoStr         = nvl(request.getParameter("tipo")).trim(); // "0" o "1"
            String  importeStr      = nvl(request.getParameter("importe")).replace(",", ".");
            String  descripcion     = nvl(request.getParameter("descripcion")).trim();
            int     idSupplier      = Integer.parseInt(request.getParameter("idProveedor"));
            BigDecimal amount       = new BigDecimal(importeStr);

            // Buscar el presupuesto correspondiente
            int currentYear = Year.now().getValue();
            int budgetType  = esPlanInversion ? 2 : 1;
            Budget budget   = new BudgetDAO().findByDeptAndType(codeDept, budgetType, currentYear);

            if (budget == null) {
                String tipoBudget = esPlanInversion ? "Plan de Inversión" : "Presupuesto General";
                json(response, false,
                     "No existe " + tipoBudget + " para tu departamento en " + currentYear + ".");
                return;
            }

            // Generar número de orden
            String orderReference;
            if (esPlanInversion) {
                orderReference = codigoManual;
            } else {
                Department dept = new DepartmentDAO().findById(codeDept);
                String deptName   = dept != null ? dept.getName() : "DEPT";
                String deptAbbrev = deptName.length() >= 3
                        ? deptName.substring(0, 3).toUpperCase()
                        : deptName.toUpperCase();

                int correlativo = new PurchaseOrderDAO().countByDeptAndYear(codeDept, currentYear) + 1;
                orderReference  = String.format("%s/%03d/%d/%s",
                                                deptAbbrev, correlativo, currentYear, tipoStr);
            }

            // Guardar la orden
            PurchaseOrder order = new PurchaseOrder();
            order.setOrderReference(orderReference);
            order.setDescription(descripcion);
            order.setAmount(amount);
            order.setIdBudget(budget.getIdBudget());
            order.setIdSupplier(idSupplier);
            order.setStatus("pending");

            int newCodeOrder = new PurchaseOrderDAO().createOrder(order);

            // Guardar factura PDF si viene adjunta
            Part facturaPart = request.getPart("factura");
            if (facturaPart != null && facturaPart.getSize() > 0) {
                byte[] pdfBytes = facturaPart.getInputStream().readAllBytes();
                Invoice invoice = new Invoice();
                invoice.setDate(new Timestamp(System.currentTimeMillis()));
                invoice.setTotalAmount(amount);
                invoice.setPdfFile(pdfBytes);
                invoice.setCodeOrder(newCodeOrder);
                new InvoiceDAO().uploadInvoice(invoice);
            }

            response.getWriter().write(
                "{\"ok\":true,\"orderReference\":\"" + esc(orderReference) + "\"}"
            );

        } catch (NumberFormatException e) {
            json(response, false, "Datos del formulario incorrectos.");
        } catch (SQLException e) {
            e.printStackTrace();
            json(response, false, "Error de base de datos: " + esc(e.getMessage()));
        }
    }

    // ── Utilidades ───────────────────────────────────────────
    private void json(HttpServletResponse response, boolean ok, String msg) throws IOException {
        response.getWriter().write(
            "{\"ok\":" + ok + ",\"error\":\"" + esc(msg) + "\"}"
        );
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }

    private String nvl(String s) {
        return s != null ? s : "";
    }
}
