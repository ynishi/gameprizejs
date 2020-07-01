import * as client from "../src/client";
import {mock, anyString, any} from 'jest-mock-extended';

describe('client', (): void => {
    test('should start new offer', (): void => {
        expect(typeof client.Client).toBe("function");
        });
});

