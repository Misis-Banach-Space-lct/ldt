package service

import (
	"errors"
	"lct/internal/model"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type jwtClaims struct {
	Username         string `json:"username"`
	RegisteredClaims jwt.RegisteredClaims
}

func CreateAccessToken(username string, secret string) (string, error) {
	key := []byte(secret)

	jwtClaims := jwtClaims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
			Subject:   username,
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwtClaims.RegisteredClaims)
	return accessToken.SignedString(key)
}

func VerifyAccessToken(accessTokenString string, secret string) (*jwt.Token, error) {
	accessToken, err := jwt.Parse(accessTokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}
	return accessToken, nil
}

func VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func AuthenticateUser(username, hashedPassword, password, role, secret string) (model.AuthResponse, error) {
	var authResponse model.AuthResponse
	if err := VerifyPassword(hashedPassword, password); err != nil {
		return authResponse, err
	}

	accessToken, err := CreateAccessToken(username, secret)
	if err != nil {
		return authResponse, err
	}

	authResponse = model.AuthResponse{
		AccessToken: accessToken,
		Type:        "Bearer",
		Role:        role,
	}
	return authResponse, nil
}
