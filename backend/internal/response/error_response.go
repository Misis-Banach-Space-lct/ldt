package response

import (
	"fmt"
	"lct/internal/logging"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func ErrGetRecordsFailed(name string, err error) error {
	logging.Log.Errorf("failed to get %s records: %+v", name, err)
	return fiber.NewError(http.StatusInternalServerError, err.Error())
}

func ErrCreateRecordsFailed(name string, err error) error {
	logging.Log.Errorf("failed to create %s records: %+v", name, err)
	return fiber.NewError(http.StatusBadRequest, err.Error())
}

func ErrUpdateRecordsFailed(name string, err error) error {
	logging.Log.Errorf("failed to update %s records: %+v", name, err)
	return fiber.NewError(http.StatusBadRequest, err.Error())
}

func ErrDeleteRecordsFailed(name string, err error) error {
	logging.Log.Errorf("failed to delete %s records: %+v", name, err)
	return fiber.NewError(http.StatusBadRequest, err.Error())
}

func ErrValidationError(field string, err error) error {
	logging.Log.Errorf("validation error in %s: %+v", field, err)
	return fiber.NewError(http.StatusUnprocessableEntity, err.Error())
}

func ErrUnauthorized(message string) error {
	logging.Log.Errorf("authorization error: %s", message)
	return fiber.NewError(http.StatusUnauthorized, message)
}

func ErrForbidden(name string) error {
	message := fmt.Sprintf("you have no access to '%s'", name)
	logging.Log.Error(message)
	return fiber.NewError(http.StatusForbidden, message)
}

func ErrCustomResponse(status int, message string, err error) error {
	logging.Log.Errorf("%s: %+v", message, err)
	return fiber.NewError(status, err.Error())
}
