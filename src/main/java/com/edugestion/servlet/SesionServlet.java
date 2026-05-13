package com.edugestion.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/SesionServlet")
public class SesionServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("role") != null) {
            String role   = (String) session.getAttribute("role");
            String nombre = (String) session.getAttribute("nombre");
            response.getWriter().write(
                "{\"role\":\"" + role + "\",\"nombre\":\"" + (nombre != null ? nombre : "") + "\"}"
            );
        } else {
            response.getWriter().write("{\"role\":null}");
        }
    }
}
