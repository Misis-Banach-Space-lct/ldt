package model

type AuthResponse struct {
	AccessToken string `json:"accessToken"`
	Type        string `json:"type"`
	Role        string `json:"role" validate:"oneof=admin viewer"`
}
