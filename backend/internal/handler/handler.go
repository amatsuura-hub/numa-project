package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/numa-project/backend/internal/repository"
)

type Handler struct {
	repo repository.Repository
}

func New(repo repository.Repository) *Handler {
	return &Handler{repo: repo}
}

// API error types
var (
	ErrBadRequest   = errors.New("BAD_REQUEST")
	ErrUnauthorized = errors.New("UNAUTHORIZED")
	ErrForbidden    = errors.New("FORBIDDEN")
	ErrNotFound     = errors.New("NOT_FOUND")
	ErrConflict     = errors.New("CONFLICT")
	ErrInternal     = errors.New("INTERNAL_ERROR")
)

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorBody struct {
	Error APIError `json:"error"`
}

func NewAPIError(code error, message string) error {
	return &apiError{code: code, message: message}
}

type apiError struct {
	code    error
	message string
}

func (e *apiError) Error() string {
	return e.message
}

func (e *apiError) Unwrap() error {
	return e.code
}

func ErrorResponse(err error, headers map[string]string) events.APIGatewayProxyResponse {
	statusCode := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	message := "Internal server error"

	var ae *apiError
	if errors.As(err, &ae) {
		message = ae.message
		switch {
		case errors.Is(ae.code, ErrBadRequest):
			statusCode = http.StatusBadRequest
			code = "BAD_REQUEST"
		case errors.Is(ae.code, ErrUnauthorized):
			statusCode = http.StatusUnauthorized
			code = "UNAUTHORIZED"
		case errors.Is(ae.code, ErrForbidden):
			statusCode = http.StatusForbidden
			code = "FORBIDDEN"
		case errors.Is(ae.code, ErrNotFound):
			statusCode = http.StatusNotFound
			code = "NOT_FOUND"
		case errors.Is(ae.code, ErrConflict):
			statusCode = http.StatusConflict
			code = "CONFLICT"
		}
	}

	body, _ := json.Marshal(ErrorBody{Error: APIError{Code: code, Message: message}})
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    headers,
		Body:       string(body),
	}
}
