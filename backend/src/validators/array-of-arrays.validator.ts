import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'arrayOfArraysOfIntegers', async: false })
export class ArrayOfArraysOfIntegers implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    console.log('Validating answers:', value); // Отладочный вывод
    if (!Array.isArray(value)) {
      console.log('Not an array:', value);
      return false;
    }
    const isValid = value.every((subArray) => {
      if (!Array.isArray(subArray)) {
        console.log('Sub-item is not an array:', subArray);
        return false;
      }
      return subArray.every((item) => {
        const isInteger = Number.isInteger(item);
        if (!isInteger) console.log('Item is not an integer:', item);
        return isInteger;
      });
    });
    console.log('Validation result:', isValid);
    return isValid;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'each value in answers must be an array of integers';
  }
}
