import type { Language } from "./languages";

export const STARTERS: Record<Language, string> = {
  javascript: `console.log("Hello, world!");
`,
  typescript: `const message: string = "Hello, world!";
console.log(message);
`,
  python: `print("Hello, world!")
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello, world!" << std::endl;
    return 0;
}
`,
  c: `#include <stdio.h>

int main(void) {
    puts("Hello, world!");
    return 0;
}
`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
`,
};

export function isUntouchedStarter(code: string): boolean {
  return Object.values(STARTERS).includes(code);
}