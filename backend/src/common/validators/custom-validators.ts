import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'arrayLengthMatches', async: false })
export class ArrayLengthMatches implements ValidatorConstraintInterface {
  validate(value: any[], args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return (
      Array.isArray(value) &&
      Array.isArray(relatedValue) &&
      value.length === relatedValue.length
    );
  }
}
