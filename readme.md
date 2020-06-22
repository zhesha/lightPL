# Get started

## Install
`npm i -g lightpl`

## To execute:
```shell script
light <file_name>
```

## To translate to js:
```shell script
light <file_name> -js
```

## Hello world
To print "Hello world" in terminal, create new file `hello_world.lpl`, then print:
```
print('Hello world')
```
and run(in terminal):
```shell script
light hello_world.lpl
```

# Language tour

## Variables
Variables can be defined with "var" keyword
```
var variableName
```

Multiple variables can be defined together, separated by coma
```
var variable1, variable2, variable3
```

During definition variables can be initialized
```
var variable = 0
``` 

## Values
### Number
Variables can contain number
```
var variable = 0
``` 

### String
String should be in single quote
```
var variable = 'Hello world'
``` 

### Bool
Bool is one of two literals 
```
var on = true
var off = false
``` 

### Null
Null represent nothing 
```
var empty = null
``` 

## Collections
### List
to store similar data you can use lists
```
var list = [1, 23, 1234]
``` 
### Map
to store data as "key" "value" pares
```
var legs = [
    'dog': 4,
    'cat': 4,
    'spider': 8
]
```

## Control flow statements
### If
if statements with optional else statements:
```
if age < 18 {
    print('Access deny')
} else {
    print('Hello')
}
``` 

### While
A while loop evaluates the condition before the loop:
```
while apples > 0 {
    print('You have ' + apples + ' apples')
    apples = apples - 1
}
```

### For
"for" is iteration for collections:
```
for var item in beg {
    print(item)
}
```

## Operations
### Mathematical
'+', '-', '*', '/'
```
var ourMoney = myMoney + yourMoney
```

### Comparision
'==', '!=', '>=', '<=', '>', '<'
```
if playerHealth == 0 {
    print('You lose')
}
```

### Logical
'!', '&&', '||'
```
if day == 'sunday' || day == 'saturday' {
    print('This is weekend')
}
```

## Comments
you can comment your code to explain it purpose
```
// We store time in seconds but show it in minutes
print(time / 60)
```