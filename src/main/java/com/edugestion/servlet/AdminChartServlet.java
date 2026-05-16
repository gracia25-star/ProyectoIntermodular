package com.edugestion.servlet;

import com.edugestion.dao.BudgetDAO;
import com.edugestion.dao.DepartmentDAO;
import com.edugestion.model.Budget;
import com.edugestion.model.Department;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Year;
import java.util.List;

@WebServlet("/AdminChartServlet")
public class AdminChartServlet extends HttpServlet {

    // GET → datos de todos los departamentos para el año actual
    // { departamentos:[...], presupuestos:{total:[...], gastado:[...]}, planes:{total:[...], gastado:[...]} }
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        response.setContentType("application/json;charset=UTF-8");

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

        try {
            DepartmentDAO deptDao   = new DepartmentDAO();
            BudgetDAO     budgetDao = new BudgetDAO();
            int currentYear = Year.now().getValue();

            List<Department> depts = deptDao.findAll();
            int n = depts.size();

            String[]     nombres     = new String[n];
            BigDecimal[] presTotal   = new BigDecimal[n];
            BigDecimal[] presGastado = new BigDecimal[n];
            BigDecimal[] planTotal   = new BigDecimal[n];
            BigDecimal[] planGastado = new BigDecimal[n];

            for (int i = 0; i < n; i++) {
                int codeDept = depts.get(i).getCodeDept();
                nombres[i] = depts.get(i).getName();

                Budget bPres = budgetDao.findByDeptAndType(codeDept, 1, currentYear);
                if (bPres != null) {
                    presTotal[i]   = bPres.getTotalAmount();
                    presGastado[i] = budgetDao.getSpentAmount(bPres.getIdBudget());
                } else {
                    presTotal[i]   = BigDecimal.ZERO;
                    presGastado[i] = BigDecimal.ZERO;
                }

                Budget bPlan = budgetDao.findByDeptAndType(codeDept, 2, currentYear);
                if (bPlan != null) {
                    planTotal[i]   = bPlan.getTotalAmount();
                    planGastado[i] = budgetDao.getSpentAmount(bPlan.getIdBudget());
                } else {
                    planTotal[i]   = BigDecimal.ZERO;
                    planGastado[i] = BigDecimal.ZERO;
                }
            }

            StringBuilder json = new StringBuilder();
            json.append("{");

            json.append("\"departamentos\":[");
            for (int i = 0; i < n; i++) {
                if (i > 0) json.append(",");
                json.append("\"").append(esc(nombres[i])).append("\"");
            }
            json.append("],");

            json.append("\"presupuestos\":{");
            json.append("\"total\":[");
            for (int i = 0; i < n; i++) { if (i > 0) json.append(","); json.append(presTotal[i]); }
            json.append("],\"gastado\":[");
            for (int i = 0; i < n; i++) { if (i > 0) json.append(","); json.append(presGastado[i]); }
            json.append("]},");

            json.append("\"planes\":{");
            json.append("\"total\":[");
            for (int i = 0; i < n; i++) { if (i > 0) json.append(","); json.append(planTotal[i]); }
            json.append("],\"gastado\":[");
            for (int i = 0; i < n; i++) { if (i > 0) json.append(","); json.append(planGastado[i]); }
            json.append("]}");

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
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
