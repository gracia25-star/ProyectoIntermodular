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
import java.util.List;

@WebServlet("/BudgetServlet")
public class BudgetServlet extends HttpServlet {

    // GET → presupuestos del usuario en sesión con gasto y saldo restante
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
            BudgetDAO dao = new BudgetDAO();
            DepartmentDAO deptDao = new DepartmentDAO();
            List<Budget> budgets = dao.findByUser(idUser);

            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < budgets.size(); i++) {
                Budget b = budgets.get(i);
                BigDecimal gastado   = dao.getSpentAmount(b.getIdBudget());
                BigDecimal remaining = b.getTotalAmount().subtract(gastado);

                String deptName = "—";
                if (b.getCodeDept() != null) {
                    Department dept = deptDao.findById(b.getCodeDept());
                    if (dept != null) deptName = dept.getName();
                }

                json.append("{")
                    .append("\"idBudget\":").append(b.getIdBudget()).append(",")
                    .append("\"totalAmount\":").append(b.getTotalAmount()).append(",")
                    .append("\"year\":").append(b.getYear()).append(",")
                    .append("\"type\":").append(b.getType()).append(",")
                    .append("\"codeDept\":").append(b.getCodeDept()).append(",")
                    .append("\"deptName\":\"").append(esc(deptName)).append("\",")
                    .append("\"gastado\":").append(gastado).append(",")
                    .append("\"remaining\":").append(remaining)
                    .append("}");
                if (i < budgets.size() - 1) json.append(",");
            }
            json.append("]");
            response.getWriter().write(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
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
