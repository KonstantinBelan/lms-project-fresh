import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'arrayOrString', async: false })
export class ArrayOrStringValidator implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!Array.isArray(value)) return false;
    return value.every((item) => {
      if (Array.isArray(item)) {
        return item.every((subItem) => Number.isInteger(subItem));
      }
      return typeof item === 'string';
    });
  }

  defaultMessage(args: ValidationArguments): string {
    return 'each value in answers must be an array of integers or a string';
  }
}
