---
layout: post
title: "객체지향 관용구"
author: "Polishedwh"
---

## 컨텍스트 관리자와 else 블록
- with 문과 콘텍스트 관리자
- for,while,try 문에서 else 블록

### 이것 다음에 저것: if문 이외에서의 else블록
- for, while
  - loop실행 후 else 블록이 실행된다.
  - loop동작 중에 return, break, continue 등이 실행되면 else 블록은 실행되지 않는다.

- try/except
  - try 블록이 정상 실행 되면 else 블록이 실행된다.
  - else 블록에서 예외가 발생해도 except 구문은 실행되지 않는다.

- EAEP(Easier to Ask for Forgiveness then Permission)
  - 정상 실행됨을 가정하고 일단 동작 시킨다.
  - try/catch 구문이 많다.
  - 파이썬의 코딩 스타일이다.

- LBYL(Leap Before You Leap)
  - 정상 실행되는지를 체크하고 실행한다.
  - if 구분이 많다.

### 컨텍스트 관리자와 with블록
- 컨텍스트 관리자
  - with 문을 실행할 때 컨텍스트를 정의하는 객체이다.
  - 자원의 lock/unlock, 열린 파일의 close 등에 사용한다.
  - object.__enter__(self)
    - 컨텍스트에 진입한다.
    - with문에서 as 절로 지정된 대상이 있으면 이 메서드의 반환 값을 사용한다.
    - 이 메서드가 정상적으로 반환되면 __exit__가 항상 호출된다.

  - object.__exit__(self, exc_type, exc_value, traceback)
    - 컨텍스트를 종료한다.
    - 매개변수를 이용해 종료 상태를 나타낼 수 있다.(없으면 세 변수 모두 None이 됨)
    - __enter__이전에 먼저 로드되고 정상 리턴되면 실행된다.

- with 블록은 블록의 실행이 중단되더라도 반드시 실행된다.
  - 중단의 예: 예외발생, return, sys.exit() 등

- 15-1
{% highlight python %}
>>> with open('mirror.py') as fp: #
...
src = fp.read(60) #
...
>>> len(src)
60
>>> fp #
    <_io.TextIOWrapper name='mirror.py' mode='r' encoding='UTF-8'>
>>> fp.closed, fp.encoding #
(True, 'UTF-8')
>>> fp.read(60) #
Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
ValueError: I/O operation on closed file.
{% endhighlight %}

- 15-2
{% highlight python %}
>>> from mirror import LookingGlass
>>> with LookingGlass() as what:
...    print('Alice, Kitty and Snowdrop')
...    print(what)
...
pordwonS dna yttiK ,ecilA
YKCOWREBBAJ
>>> what
'JABBERWOCKY'
>>> print('Back to normal.')
Back to normal.
{% endhighlight %}

- 15-3
{% highlight python %}
class LookingGlass:

    def __enter__(self):
        import sys
        self.original_write = sys.stdout.write
        sys.stdout.write = self.reverse_write
        return 'JABBERWOCKY'

    def reverse_write(self, text):
        self.original_write(text[::-1])

    def __exit__(self, exc_type, exc_value, traceback):
        import sys
        sys.stdout.write = self.original_write
        if exc_type is ZeroDivisionError:
            print('Please DO NOT divide by zero!')
            return True
{% endhighlight %}

- 15-4
{% highlight python %}
>>> from mirror import LookingGlass
>>> manager = LookingGlass()
>>> manager
<mirror.LookingGlass object at 0x2a578ac>
>>> monster = manager.__enter__()
>>> monster == 'JABBERWOCKY'
eurT
>>> monster
'YKCOWREBBAJ'
>>> manager
>ca875a2x0 ta tcejbo ssalGgnikooL.rorrim<
>>> manager.__exit__(None, None, None)
>>> monster
'JABBERWOCKY'
{% endhighlight %}

### contextlib utilities

### @contextmanager 사용

{% highlight python %}
import contextlib

@contextlib.contextmanager
def looking_glass():
    import sys
    original_write = sys.stdout.write

    def reverse_write(text):
        original_write(text[::-1])

    sys.stdout.write = reverse_write
    yield 'JABBERWOCKY'
    sys.stdout.write = original_write
{% endhighlight %}


- 15-6
{% highlight python %}
>>> from mirror_gen import looking_glass
>>> with looking_glass() as what:
...    print('Alice, Kitty and Snowdrop')
...    print(what)
...
pordwonS dna yttiK ,ecilA
YKCOWREBBAJ
>>> what
'JABBERWOCKY'
{% endhighlight %}

- 15-7
{% highlight python %}
import contextlib

@contextlib.contextmanager
def looking_glass():
    import sys
    original_write = sys.stdout.write

    def reverse_write(text):
        original_write(text[::-1])

    sys.stdout.write = reverse_write
    msg = ''
    try:
        yield 'JABBERWOCKY'
    except ZeroDivisionError:
        msg = 'Please DO NOT divide by zero!'
    finally:
        sys.stdout.write = original_write
        if msg:
            print(msg)
{% endhighlight %}

- 15-8
{% highlight python %}
import csv

with inplace(csvfilename, 'r', newline='') as (infh, outfh):
    reader = csv.reader(infh)
    writer = csv.writer(outfh)

    for row in reader:
        row += ['new', 'columns']
        writer.writerow(row)
{% endhighlight %}
