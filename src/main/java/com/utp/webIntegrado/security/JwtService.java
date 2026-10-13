package com.utp.webIntegrado.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey clave;

    public JwtService(@Value("${jwt.secret}") String secreto) {
        this.clave = Keys.hmacShaKeyFor(
            Decoders.BASE64.decode(secreto)
        );
    }

    public String generarToken(UserDetails usuario) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + 3600000);

        return Jwts.builder()
            .subject(usuario.getUsername())
            .issuedAt(ahora)
            .expiration(expiracion)
            .signWith(clave)
            .compact();
    }

    public String extraerUsuario(String token) {
        return obtenerClaims(token).getSubject();
    }

    public boolean esTokenValido(
            String token, UserDetails usuario) {

        try {
            Claims claims = obtenerClaims(token);

            return claims.getSubject().equals(usuario.getUsername())
                && claims.getExpiration() != null
                && claims.getExpiration().after(new Date());

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
            .verifyWith(clave)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}