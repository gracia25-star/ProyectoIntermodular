package com.edugestion.servlet;

import com.edugestion.dao.BudgetDAO;
import com.edugestion.dao.DepartmentDAO;
import com.edugestion.dao.UserDAO;
import com.edugestion.dao.PurchaseOrderDAO;
import com.edugestion.model.Budget;
import com.edugestion.model.Department;
import com.edugestion.model.User;
import com.edugestion.model.PurchaseOrder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/HistoricoServlet")
public class HistoricoServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"No autorizado\"}");
            return;
        }

        int idUser = (int) session.getAttribute("usuarioId");
        String role = (String) session.getAttribute("role");
        
        int year = request.getParameter("year") != null 
                   ? Integer.parseInt(request.getParameter("year"))
                   : java.util.Calendar.getInstance().get(java.util.Calendar.YEAR);

        Integer deptFilter = request.getParameter("dept") != null 
                   ? Integer.parseInt(request.getParameter("dept"))
                   : null;

        response.setContentType("application/json;charset=UTF-8");

        try {
            BudgetDAO budgetDao = new BudgetDAO();
            DepartmentDAO deptDao = new DepartmentDAO();
            UserDAO userDao = new UserDAO();
            PurchaseOrderDAO orderDao = new PurchaseOrderDAO();

            User user = userDao.findById(idUser);
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Usuario no encontrado\"}");
                return;
            }

            // ── Determinar departamento a mostrar ──
            int deptToShow;
            if ("admin".equals(role) || "accountant".equals(role)) {
                if (deptFilter == null) {
                    // Sin dept seleccionado: devolver solo la lista de departamentos
                    List<Department> depts = deptDao.findAll();
                    StringBuilder sb = new StringBuilder();
                    sb.append("{\"availableDepts\":[");
                    for (int i = 0; i < depts.size(); i++) {
                        if (i > 0) sb.append(",");
                        sb.append("{\"code\":").append(depts.get(i).getCodeDept())
                          .append(",\"name\":\"").append(esc(depts.get(i).getName())).append("\"}");
                    }
                    sb.append("],\"presupuestos\":[],\"planes\":[],\"ordenes\":[],\"deptName\":\"\",\"year\":").append(year).append("}");
                    response.getWriter().write(sb.toString());
                    return;
                }
                deptToShow = deptFilter;
            } else if ("dept_manager".equals(role)) {
                // Jefe: solo su departamento
                deptToShow = user.getCodeDept();
            } else {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("{\"error\":\"Rol no autorizado\"}");
                return;
            }

            // ── Obtener presupuestos del departamento para ese año ──
            List<Budget> budgets = budgetDao.findByDepartment(deptToShow);
            budgets.removeIf(b -> b.getYear() != year);

            StringBuilder json = new StringBuilder();
            json.append("{");

            // ── Años disponibles ──
            json.append("\"availableYears\":[");
            int currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR);
            for (int y = currentYear; y >= currentYear - 5; y--) {
                if (y < currentYear) json.append(",");
                json.append(y);
            }
            json.append("],");

            // ── Departamentos (solo para admin/contable) ──
            json.append("\"availableDepts\":[");
            if ("admin".equals(role) || "accountant".equals(role)) {
                List<Department> depts = deptDao.findAll();
                for (int i = 0; i < depts.size(); i++) {
                    if (i > 0) json.append(",");
                    json.append("{\"code\":").append(depts.get(i).getCodeDept())
                        .append(",\"name\":\"").append(esc(depts.get(i).getName())).append("\"}");
                }
            }
            json.append("],");

            // ── Presupuestos (Type = 1) ──
            json.append("\"presupuestos\":[");
            boolean firstBudget = true;

            for (Budget b : budgets) {
                if (b.getType() == 1) {
                    if (!firstBudget) json.append(",");
                    firstBudget = false;

                    BigDecimal spent = budgetDao.getSpentAmount(b.getIdBudget());
                    BigDecimal remaining = b.getTotalAmount().subtract(spent);

                    json.append("{")
                        .append("\"idBudget\":").append(b.getIdBudget()).append(",")
                        .append("\"asignado\":").append(b.getTotalAmount()).append(",")
                        .append("\"gastado\":").append(spent).append(",")
                        .append("\"restante\":").append(remaining)
                        .append("}");
                }
            }
            json.append("],");

            // ── Planes de Inversión (Type = 2) ──
            json.append("\"planes\":[");
            boolean firstPlan = true;

            for (Budget b : budgets) {
                if (b.getType() == 2) {
                    if (!firstPlan) json.append(",");
                    firstPlan = false;

                    BigDecimal spent = budgetDao.getSpentAmount(b.getIdBudget());
                    BigDecimal remaining = b.getTotalAmount().subtract(spent);

                    json.append("{")
                        .append("\"idBudget\":").append(b.getIdBudget()).append(",")
                        .append("\"asignado\":").append(b.getTotalAmount()).append(",")
                        .append("\"gastado\":").append(spent).append(",")
                        .append("\"restante\":").append(remaining)
                        .append("}");
                }
            }
            json.append("],");

            // ── Órdenes de compra del año ──
            List<PurchaseOrder> orders = orderDao.findByYear(year, deptToShow);
            json.append("\"ordenes\":[");
            for (int i = 0; i < orders.size(); i++) {
                if (i > 0) json.append(",");
                PurchaseOrder o = orders.get(i);
                String status = "pending".equals(o.getStatus()) ? "Pendiente" : "Aprobada";
                
                json.append("{")
                    .append("\"codeOrder\":").append(o.getCodeOrder()).append(",")
                    .append("\"reference\":\"").append(esc(o.getOrderReference())).append("\",")
                    .append("\"description\":\"").append(esc(o.getDescription())).append("\",")
                    .append("\"date\":\"").append(o.getDate()).append("\",")
                    .append("\"amount\":").append(o.getAmount()).append(",")
                    .append("\"status\":\"").append(status).append("\"")
                    .append("}");
            }
            json.append("],");

            // ── Información del departamento ──
            Department deptInfo = deptDao.findById(deptToShow);
            String deptName = deptInfo != null ? deptInfo.getName() : "Desconocido";

            json.append("\"deptName\":\"").append(esc(deptName)).append("\",");
            json.append("\"year\":").append(year);

            json.append("}");
            response.getWriter().write(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Error en servidor\"}");
        }
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
