package com.edugestion.servlet;

import com.edugestion.dao.*;
import com.edugestion.model.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.*;

@WebServlet("/AdminOrderServlet")
public class AdminOrderServlet extends HttpServlet {

    // ── GET: lista de órdenes (todas o filtradas por dept) ───
    // ?dept=0 o sin parámetro → todas | ?dept=N → solo ese dept
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"No autorizado\"}");
            return;
        }
        String role = (String) session.getAttribute("role");
        if (!"admin".equals(role) && !"accountant".equals(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\":\"Acceso no permitido\"}");
            return;
        }

        String deptParam = request.getParameter("dept");
        int deptCode = 0;
        try {
            if (deptParam != null && !deptParam.isEmpty()) {
                deptCode = Integer.parseInt(deptParam);
            }
        } catch (NumberFormatException ignored) {}

        try {
            PurchaseOrderDAO orderDao    = new PurchaseOrderDAO();
            BudgetDAO        budgetDao   = new BudgetDAO();
            DepartmentDAO    deptDao     = new DepartmentDAO();
            SupplierDAO      supplierDao = new SupplierDAO();
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");

            // Precargar mapas para evitar N+1
            Map<Integer, Integer> budgetToDept = new HashMap<>();
            for (Budget b : budgetDao.findAll()) {
                if (b.getCodeDept() != null) {
                    budgetToDept.put(b.getIdBudget(), b.getCodeDept());
                }
            }

            Map<Integer, String> deptNames = new HashMap<>();
            for (Department d : deptDao.findAll()) {
                deptNames.put(d.getCodeDept(), d.getName());
            }

            Map<Integer, String> supplierNames = new HashMap<>();
            for (Supplier s : supplierDao.findAll()) {
                supplierNames.put(s.getIdSupplier(), s.getName());
            }

            // Cargar órdenes
            List<PurchaseOrder> orders = deptCode > 0
                    ? orderDao.findByDepartment(deptCode)
                    : orderDao.findAll();

            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < orders.size(); i++) {
                PurchaseOrder o = orders.get(i);
                if (i > 0) json.append(",");

                String deptName = "—";
                if (o.getIdBudget() != null) {
                    Integer cd = budgetToDept.get(o.getIdBudget());
                    if (cd != null) deptName = deptNames.getOrDefault(cd, "—");
                }

                String supplierName = o.getIdSupplier() != null
                        ? supplierNames.getOrDefault(o.getIdSupplier(), "—")
                        : "—";

                String dateStr = o.getDate() != null ? sdf.format(o.getDate()) : "";

                json.append("{")
                    .append("\"codeOrder\":").append(o.getCodeOrder()).append(",")
                    .append("\"orderReference\":\"").append(esc(o.getOrderReference())).append("\",")
                    .append("\"deptName\":\"").append(esc(deptName)).append("\",")
                    .append("\"date\":\"").append(dateStr).append("\",")
                    .append("\"supplierName\":\"").append(esc(supplierName)).append("\",")
                    .append("\"amount\":").append(o.getAmount()).append(",")
                    .append("\"status\":\"").append(esc(o.getStatus())).append("\",")
                    .append("\"description\":\"").append(esc(nvl(o.getDescription()))).append("\",")
                    .append("\"comment\":\"").append(esc(nvl(o.getComment()))).append("\"")
                    .append("}");
            }
            json.append("]");
            response.getWriter().write(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Error en servidor: " + esc(e.getMessage()) + "\"}");
        }
    }

    // ── POST: actualizar estado o comentario de una orden ────
    // action=status  → parámetros: codeOrder, value (pending|approved)
    // action=comment → parámetros: codeOrder, value (texto libre)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"ok\":false,\"error\":\"No autorizado\"}");
            return;
        }
        String role = (String) session.getAttribute("role");
        if (!"admin".equals(role) && !"accountant".equals(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"ok\":false,\"error\":\"Acceso no permitido\"}");
            return;
        }

        String action    = nvl(request.getParameter("action"));
        String codeStr   = nvl(request.getParameter("codeOrder"));
        String value     = nvl(request.getParameter("value"));

        if (codeStr.isEmpty()) {
            response.getWriter().write("{\"ok\":false,\"error\":\"Falta codeOrder\"}");
            return;
        }

        try {
            int codeOrder = Integer.parseInt(codeStr);
            PurchaseOrderDAO dao = new PurchaseOrderDAO();

            if ("status".equals(action)) {
                if (!"pending".equals(value) && !"approved".equals(value) && !"rejected".equals(value)) {
                    response.getWriter().write("{\"ok\":false,\"error\":\"Estado no válido\"}");
                    return;
                }
                dao.updateStatus(codeOrder, value);
                response.getWriter().write("{\"ok\":true}");

            } else if ("comment".equals(action)) {
                dao.addComment(codeOrder, value.isEmpty() ? null : value);
                response.getWriter().write("{\"ok\":true}");

            } else {
                response.getWriter().write("{\"ok\":false,\"error\":\"Acción no reconocida\"}");
            }

        } catch (NumberFormatException e) {
            response.getWriter().write("{\"ok\":false,\"error\":\"codeOrder inválido\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"ok\":false,\"error\":\"Error de base de datos\"}");
        }
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }

    private String nvl(String s) { return s != null ? s : ""; }
}
