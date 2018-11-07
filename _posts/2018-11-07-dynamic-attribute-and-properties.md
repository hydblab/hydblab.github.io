---
layout: post
title: "동적 속성과 프로퍼티"
author: "Polishedwh"
---
## 동적 속성과 프로퍼티

### 동적 속성을 이용한 데이터 랭글링

- osconfeed.json의 JSON 샘플 레코드 
  - conferences에만 레코드가 하나 들어있고 나머지 리스트에는 수십 수만개가 들어있다.
{% highlight python %}
{ "Schedule":
    { "conferences": [{"serial": 115 }],
        "events": [
        { "serial": 34505,
            "name": "Why Schools Don ́t Use Open Source to Teach Programming",
            "event_type": "40-minute conference session",
            "time_start": "2014-07-23 11:30:00",
            "time_stop": "2014-07-23 12:10:00",
            "venue_serial": 1462,
            "description": "Aside from the fact that high school programming...",
            "website_url": "http://oscon.com/oscon2014/public/schedule/detail/34505",
            "speakers": [157509],
            "categories": ["Education"] }
        ],
        "speakers": [
        { "serial": 157509,
            "name": "Robert Lefkowitz",
            "photo": null,
            "url": "http://sharewave.com/",
            "position": "CTO",
            "affiliation": "Sharewave",
            "twitter": "sharewaveteam",
            "bio": "Robert  ́r0ml ́ Lefkowitz is the CTO at Sharewave, a startup..." }
        ],
        "venues": [
        { "serial": 1462,
            "name": "F151",
            "category": "Conference Venues" }
        ]
    }
}
{% endhighlight %}

- osconfeed.py:osconfeed.json 내려받기 예제
  - 지역에 사본이 있는지 검사하고 없는 경우에만 피드를 내려받음(불필요한 트레픽 방지)
{% highlight python %}
from urllib.request import urlopen
import warnings
import os
import json
URL = 'http://www.oreilly.com/pub/sc/osconfeed'
JSON = 'data/osconfeed.json'
def load():
    if not os.path.exists(JSON):
        msg = 'downloading {} to {}'.format(URL, JSON)
        warnings.warn(msg) # 새로 받아야 할 때 경고 메세지 출력
        with urlopen(URL) as remote, open(JSON, 'wb') as local: # 원격 파일을 읽고 저장
            local.write(remote.read())
    with open(JSON) as fp:
        return json.load(fp) # JSON 파일을 파싱하고 네이티브 파이썬 객체로 반환(dist,list,str,int 형식 데이터)
{% endhighlight %}

- osconfeed.py: 위 예제 doctest
{% highlight python %}
>>> feed = load() # dict 및 문자열과 정수값이 들어있는 리스트를 가진 딕셔너리 객체가 리턴됨
>>> sorted(feed['Schedule'].keys()) # Schedule 안에 있는 네 개의 레코드 컬렉션을 나열
['conferences', 'events', 'speakers', 'venues']
>>> for key, value in sorted(feed['Schedule'].items()):
...     print('{:3} {}'.format(len(value), key)) # 각 컬렉션 안에 있는 레코드 수 출력
...
  1 conferences
484 events
357 speakers
 53 venues
>>> feed['Schedule']['speakers'][-1]['name'] # 틱셔너리와 리스트를 조사해서 마지막 발표자의 이름을 가져옴
'Carina C. Zona'
>>> feed['Schedule']['speakers'][-1]['serial'] # 마지막 발표자의 일련번호
141590
>>> feed['Schedule']['events'][40]['name']
'There *Will* Be Bugs'
>>> feed['Schedule']['events'][40]['speakers'] # 각 이벤트에는 0개 이상의 발표자 일련번호가 들어있는 speakers 리스트가 있다
[3471, 5199]
{% endhighlight %}


#### 동적 속성을 이용해서 JSON과 유사한 데이터 둘러보기

- feed['Schedule']['events'][40]['speakers']와 같은 접근 방법은 번거롭다.
  - feed.Schedule.events[40] 와 같이 js 접근 방법처럼 접근해보다.
{% highlight python %}
>>> from osconfeed import load
>>> raw_feed = load() # 딕셔너리와 리스트로 구성된 raw_feed
>>> feed = FrozenJSON(raw_feed) # raw_feed데이터를 베이스로 FrozenJSON객체 생성
>>> len(feed.Schedule.speakers) # 발표자 리스트의 길이 반환, dot(.)로 접근
357
>>> sorted(feed.Schedule.keys()) # key()등 딕셔너리의 메서드에도 접근해서 레코드 컬렉션명을 가져옴 수 있음
['conferences', 'events', 'speakers', 'venues']
>>> for key, value in sorted(feed.Schedule.items()): # items()를 이용해서 컬렉션명 및 내용을 가져와 항목 길이 출력 가능
...     print('{:3} {}'.format(len(value), key))
...
  1 conferences
484 events
357 speakers
  53 venues
>>> feed.Schedule.speakers[-1].name # list는 그대로 list로 남지만 내부 항목 중 매핑 형은 FrozenJSON으로 변환됨
'Carina C. Zona'
>>> talk = feed.Schedule.events[40]
>>> type(talk) # 
<class 'explore0.FrozenJSON'> # 내부 항목이 변환되어 있다
>>> talk.name
'There *Will* Be Bugs'
>>> talk.speakers # speakers 리스트
[3471, 5199]
>>> talk.flavor # 없는 속성에 접근하면 AttributeError 대신 KeyError가 발생
Traceback (most recent call last):
  ...
KeyError: 'flavor'
{% endhighlight %}

- FrozenJSON 구현(읽기만 구현되어있다, 필자가 직접 구현한 것)
{% highlight python %}
from collections import abc
class FrozenJSON:
    """A read-only façade for navigating a JSON-like object
       using attribute notation
    """

    def __init__(self, mapping):
        self.__data = dict(mapping) # 매핑 인수로부터 딕서너리 생성(딕서너리 메서드사용가능, 원본 변경 방지) 

    def __getattr__(self, name): # name 속성이 없을때만 호출됨
        if hasattr(self.__data, name):
            return getattr(self.__data, name) # __data에 들어 있는 객체가 name 속성을 가지고 있다면 그 속성을 반환(key()가 처리하는 방식과 동일)
        else:
            return FrozenJSON.build(self.__data[name]) # 아니면 self.__data에서 name을 키로 사용해 항목을 가져와 FrozenJSON.buid()의 결과 반환 

    @classmethod
    def build(cls, obj): # 대안 생성자로 일반적으로 @classmethod 데커레이터가 사용됨
        if isinstance(obj, abc.Mapping): # obj가 매핑형이면 매핑형 객체를 매개변수로 FrozenJSON 객체를 생성
            return cls(obj)
        elif isinstance(obj, abc.MutableSequence): # MutableSequence형이면 리스트이므로 obj 안에 있는 모든 항목에 build()메서드를 적용해서 생성된 객체를 리스트로 반환
            return [cls.build(item) for item in obj]
        else: # 매핑도 아니고 리스트도 아니면 그대로 반환
            return obj 
{% endhighlight %}

- Note : 데이터를 JSON에서 가져왔기 때문에 컬렉션형은 dict, list만 존재한다.

#### 잘못된 속성명 문제

- 파이썬 키워드가 속성명으로 사용된 경우에 처리할 수 없다.
  - class가 파이썬의 예약어라 grad.class 속성을 읽을 수 없다.
{% highlight python %}
>>> grad = FrozenJSON({'name': 'Jim Bo', 'class': 1982})
--------------------------------------------------------
>>> grad.class
  File "<stdin>", line 1
    grad.class
             ^
SyntaxError: invalid syntax
--------------------------------------------------------
>>> getattr(grad, 'class') # 이렇게 읽을수는 있다.
1982
--------------------------------------------------------
>>> grad.class_ # FrozenJSON.__init__에서 파이썬 키워드인지 검사하고 파이썬 키워드라면 _를 붙여주면 좋다.
1982
{% endhighlight %}

-
{% highlight python %}
def __init__(self, mapping):
    self.__data = {}
    for key, value in mapping.items():
        if keyword.iskeyword(key):
            key += '_' # '_'를 붙여줌
        self.__data[key] = value
--------------------------------------------------------
>>> x = FrozenJSON({'2be':'or not'}) # 올바른 파이썬 식별자가 아닐 때도 문제가 생긴다.
>>> x.2be
  File "<stdin>", line 1
    x.2be
      ^
SyntaxError: invalid syntax
{% endhighlight %}

- Note :  파이썬 3의 str 클래스는 STR.isidentifier() 메서드로 정당한 식별자를 탐지할 수 있다.

#### __new__()를 이용한 융통성 있는 객체 생성

- 실제로 객체를 생성하는 특별 메서드는 __new__() 이다.
  - 클래스 메서드이지만 특별 메서드라 @classmethod 테커레이터를 사용하지 않는다.
  - 반드시 객체를 반환한다.
  - 반환된 객체가 __init__()의 첫 번째 인수인 self로 전달된다.
  - __init__()은 호출 될 때 객체를 받고 아무것도 반환할 수 없기 때문에 사실 초기화 메서드다.

- __new__() 메서드는 다른 클래스으ㅔ 객체도 반환 할 수 있다.
  - __init__()을 호출하지 않는다.

-  객체를 생성하는 의사코드
{% highlight python %}
\# pseudo-code for object construction
def object_maker(the_class, some_arg):
    new_object = the_class.__new__(some_arg)
    if isinstance(new_object, the_class):
        the_class.__init__(new_object, some_arg)
    return new_object
\# the following statements are roughly equivalent
x = Foo('bar')
x = object_maker(Foo, 'bar')
{% endhighlight %}

- FrozenJSON 객체든 아니든 새로운 객체를 생성하는 대신 __new__() 사용
  - build() 클래스에서 처리하던 내용을 __new__()메스드로 옮김
{% highlight python %}
from collections import abc

class FrozenJSON:
    """A read-only façade for navigating a JSON-like object
        using attribute notation
    """

    def __new__(cls, arg): # 첫 번재로 받는 인수는 클래스 자신, 나머지 인수는 __init__()과 동일하게 받음 
        if isinstance(arg, abc.Mapping):
            return super().__new__(cls) # 슈퍼 클래스의 __new__()에 위임, FrozenFSON을 인수로 전달
        elif isinstance(arg, abc.MutableSequence): #  나머지는 build()와 동일
            return [cls(item) for item in arg]
        else:
            return arg
    def __init__(self, mapping):
        self.__data = {}
        for key, value in mapping.items():
            if iskeyword(key):
                key += '_'
            self.__data[key] = value
    def __getattr__(self, name):
        if hasattr(self.__data, name):
            return getattr(self.__data, name)
        else:
            return FrozenJSON(self.__data[name]) # 기존에는 FrozenJSON.build() 호출 
{% endhighlight %}

- Note
  - __init__()은 첫번째 인수는 self
  - FrozenJSON.__new__() 안에서 super().__new__(cls)가 object.(FrozenJSON)을 호출하는 셈이됨
  - 인터프리터 내부에서 object.__new__()가 객체를 생성하지만, 생성된 객체의 __class__속성은 FrozenJSON을 가리킴

#### shelve를 이용해서 OSCON 피드 구조 변경하기

- shelve
  - shelve.open()은 shelve.Shelf 객체를 반환한다.
  - dbm 모듈을 이용해서 키-값 객체를 보관하는 단순 객체이다.

- 특징
  - 매핑형이 제공하는 핵심 메서드를 제공한다.
    - abc.MutableMapping 클래스를 상속 받는다.
  - sync(), close()등 입출력 관리 메서드를 제공한다.
  - 새로운 값이 키에 할당될 때마다 키와 값이 지정된다.
  - 키는 반드시 문자열이어야 한다.
  - 값은 반드시 pickle 모듈이 처리할 수 있는 객체여야 한다.

- 기능 시험(위 예제 문제 해결)
  - 이전 예제는  인덱스 40번에 있는 이벤트에 두 명의 발표자(3471, 5199)가 있지만, 발표자를 찾기 쉽지 않다.
{% highlight python %}
>>> import shelve
>>> db = shelve.open(DB_NAME) # 기존 데이터베이스 파일을 열거나 새로 만든다.
>>> if CONFERENCE not in db: # 테이터가 있는지 알려진 키로 접근해 확인한다.
...     load_db(db) # 데이터베이스가 비어 있으면 데이터베이스를 로딩한다.
...
>>> speaker = db['speaker.3471'] # speaker레코드를 가져온다.
>>> type(speaker) # Record 클래스의 객체를 반환한다.(아래 예제)
<class 'schedule1.Record'>
>>> speaker.name, speaker.twitter # Record객체는 하위 JSON 레코드의 필드를 반영한 속성을 구현한다.
('Anna Martelli Ravenscroft', 'annaraven')
>>> db.close() # 반드시 닫아야한다.
{% endhighlight %}  

- shelve.Shelf에 저장된 OSCON 일정 테이터 보기
{% highlight python %}
import warnings

import osconfeed # osconfeed.py 모듈을 로드 

DB_NAME = 'data/schedule1_db'
CONFERENCE = 'conference.115'

class Record:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs) # 키워드 인수로부터 생성된 속성으로 객체를 생헝할때 사용

    def load_db(db):
        raw_data = osconfeed.load() # 티스크에 사본이 없는 경우 웹에서 JSON 피드를 가져올 수 있음 
        warnings.warn('loading ' + DB_NAME)
        for collection, rec_list in raw_data['Schedule'].items(): # conferences, events 등 컬렉션을 반복 
            record_type = collection[:-1] # 컬레션명에서 마지막의 's' 제거하고 record_type으로 설정 
            for record in rec_list:
                key = '{}.{}'.format(record_type, record['serial']) # record_type과 'serial'필드로부터 key를 생성 
                record['serial'] = key # 'serial' 필드를 새로 생성한 key로 설정 
                db[key] = Record(**record) # Record객체를 생성하고 그 key로 데이터베이스에 저장
{% endhighlight %}

- Note
  - __slots__ 속성이 클래스에 선언되어 있지 않은한, 객체의 __dict__에 속성들이 들어있다. 
  - 객체의 __dict__를 직접 매핑형으로 설정하면, 속성 묶음을 빠르게 정의할 수 있다.

#### 프로퍼티를 이용해서 연결된 레코드 읽기

- shelf에서 가져온 event 레코드의 venue나 speakers속성을 읽을 때 일련번호 대신 온전한 레코드를 객체로 반환하도록 만들어보자.

- schedule2.py의 doctest 일부

{% highlight python %}
>>> DbRecord.set_db(db) # Record를 상속해서 데이터베이스를 지원한다. DbRecord에 데이터베이스에 대한 참조를 전달해야 한다. 
>>> event = DbRecord.fetch('event.33950') # 어떠한 종류의 레코드도 가져옴 
>>> event # DbRecord 클래스를 상속한 Event 클래스 객체임
<Event 'There *Will* Be Bugs'>
>>> event.venue # DbRecord 객체가 반환됨 
<DbRecord serial='venue.1449'>
>>> event.venue.name # 이렇게 자동으로 참조소환하는 것이 예제의 목표 
'Portland 251'
>>> for spkr in event.speakers: # 각 발표자의 DbRecord 객체도 가져올 수 있음 
...     print('{0.serial}: {0.name}'.format(spkr))
...
speaker.3471: Anna Martelli Ravenscroft
speaker.5199: Alex Martelli
{% endhighlight %}

- schedule2.py: 임포트, 상수, 개선된 Record 클래스
{% highlight python %}
import warnings
import inspect #load_db() 함수에서 inspect 모듈을 사용
import osconfeed

DB_NAME = 'data/schedule2_db' # 새로 생성해서 사용 
CONFERENCE = 'conference.115'

class Record:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __eq__(self, other): # 배교하는데 유용하게 사용됨
        if isinstance(other, Record):
            return self.__dict__ == other.__dict__
        else:
            return NotImplemented
{% endhighlight %}

- schedule2.py: MissingDatabaseError, DbRecord 클래스
{% highlight python %}
class MissingDatabaseError(RuntimeError):
    """Raised when a database is required but was not set.""" # pass문 보다 이렇게 하는게 좋다. 

class DbRecord(Record): # Record클래스를 상속

    __db = None # shelve.Shelf 데이터베이스에 대한 참조를 보관 

    @staticmethod # 정적 메서드로 호출 방법에 무관하게 언제나 동일한 결과가 나옴을 명시 
    def set_db(db):
        DbRecord.__db = db # Event.set_db()를 호출해도 DbRecord클래스에 __db 속성이 설정됨

    @staticmethod # 정적 메서드로 호출 방법에 무관하게 언제나 DbRecord.__db가 참조하는 객체를 반환 
    def get_db():
        return DbRecord.__db

    @classmethod # 클래스 메서드이므로 서브클래스에서 쉽게 커스터마이즈 할 수 있음 
    def fetch(cls, ident):
        db = cls.get_db()
        try:
            return db[ident] # ident 키를 가진 레코드를 가져옴 
        except TypeError:
            if db is None: # TypeError가 발생하고 db가 None이면 사용자 정의 예외를 발생시킴 
                msg = "database not set; call '{}.set_db(my_db)'"
                raise MissingDatabaseError(msg.format(cls.__name__))
            else: # ?? 
                raise

     def __repr__(self):
         if hasattr(self, 'serial'): # 레코드에 'serial' 속성이 있으면 문자열 표현 안에 사용함 
             cls_name = self.__class__.__name__
             return '<{} serial={!r}>'.format(cls_name, self.serial)
         else:
             return super().__repr__() # 없으면 슈퍼클래스의 __repr__()메서드를 사용 
{% endhighlight %}

- schedule2.py: Event클래스
{% highlight python %}
class Event(DbRecord): # DbRecord 클래스를 상속 

    @property
     def venue(self):
         key = 'venue.{}'.format(self.venue_serial)
         return self.__class__.fetch(key) # venue_serial 속성으로부터 key를 생성하고 DbRecord에서 상속한 fetch() 클래스 메서드에 전달 

    @property
    def speakers(self):
        if not hasattr(self, '_speaker_objs'): # 레코드에 _speaker_objs 속성이 있는지 검사 
            spkr_serials = self.__dict__['speakers'] # 없으면 __dict__객체에서 'speakers' 속성을 가져옴 
            fetch = self.__class__.fetch # 클래스 메서드에 대한 참조를 가져옴 
            self._speaker_objs = [fetch('speaker.{}'.format(key))
                                  for key in spkr_serials] # speaker 레코드의 리스트로 self._speaker_objs를 설정 
        return self._speaker_objs # 리스트 반환 

    def __repr__(self):
        if hasattr(self, 'name'): # 레코드에 'name'속성이 있으면 문자열로 표현
            cls_name = self.__class__.__name__
            return '<{} {!r}>'.format(cls_name, self.name)
        else:
            return super().__repr__() # 없으면 슈퍼클래스의 __repr__() 메서드를 호출 
{% endhighlight %}

- schedule2.py: load_db() 함수
{% highlight python %}
def load_db(db):
    raw_data = osconfeed.load()
    warnings.warn('loading ' + DB_NAME)
    for collection, rec_list in raw_data['Schedule'].items():
        record_type = collection[:-1] #  schedule1.py와 동일  
        cls_name = record_type.capitalize() # 클래스명으로 사용하기 위해 record_type의 첫 글자를 대문자로 변경 
        cls = globals().get(cls_name, DbRecord) # 전역 범위에서 클래스명의 객체를 가져옴, 없다면 DbRecord객체를 가져옴 
        if inspect.isclass(cls) and issubclass(cls, DbRecord): #  클래스인지 DbRecord의 서브 클래스인지 검사
            factory = cls # factory 클래스에 바인딩, factory는 record_type에 따라 DbRecord의 서브 클래스가 될 수도 있음
        else:
            factory = DbRecord # factory를 DbRecord에 바인딩 
        for record in rec_list: # key를 생성하고 레코드를 저장
            key = '{}.{}'.format(record_type, record['serial'])
            record['serial'] = key
            db[key] = factory(**record) # 데이터베이스에 저장할 객체는 factory로 생성됨, record_type에 따라 DbRecord나 DbRecord의 서브 클래스 가 될 수 있음 
{% endhighlight %}

<hr>
### 속성을 검증하기 위해 프로퍼티 사용하기
-
{% highlight python %}

{% endhighlight %}

#### LineItem버전 #1: 주문 항목 클래스

-
{% highlight python %}
class LineItem:

    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price

    def subtotal(self):
        return self.weight * self.price
{% endhighlight %}

-
{% highlight python %}
>>> raisins = LineItem('Golden raisins', 10, 6.95)
>>> raisins.subtotal()
69.5
>>> raisins.weight = -20 # garbage in...
>>> raisins.subtotal()   # garbage out...
-139.0
{% endhighlight %}

#### LineItem버전 #2: 검증하는 프로퍼티

-
{% highlight python %}
class LineItem:
    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price

    def subtotal(self):
        return self.weight * self.price

    @property
    def weight(self):
        return self.__weight

    @weight.setter
    def weight(self, value):
        if value > 0:
            self.__weight = value
        else:
            raise ValueError('value must be > 0')
{% endhighlight %}

-
{% highlight python %}
>>> walnuts = LineItem('walnuts', 0, 10.00)
Traceback (most recent call last):
    ...
ValueError: value must be > 0
{% endhighlight %}


<hr>
### 프로퍼티 제대로 알아보기

-
{% highlight python %}
property(fget=None, fset=None, fdel=None, doc=None)
{% endhighlight %}

-
{% highlight python %}
class LineItem:
    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price
    def subtotal(self):
        return self.weight * self.price
    def get_weight(self):
        return self.__weight
    def set_weight(self, value):
        if value > 0:
            self.__weight = value
        else:
            raise ValueError('value must be > 0')
        weight = property(get_weight, set_weight)
{% endhighlight %}

#### 객체 속성을 가리는 프로퍼티
-
{% highlight python %}
>>> class Class: #
...     data = 'the class data attr'
...     @property
...     def prop(self):
...         return 'the prop value'
...
>>> obj = Class()
>>> vars(obj) #
{}
>>> obj.data #
'the class data attr'
>>> obj.data = 'bar' #
>>> vars(obj) #
{'data': 'bar'}
>>> obj.data #
'bar'
>>> Class.data #
'the class data attr'
{% endhighlight %}

-
{% highlight python %}
>>> Class.prop #
<property object at 0x1072b7408>
>>> obj.prop #
'the prop value'
>>> obj.prop = 'foo' #
Traceback (most recent call last):
    ...
AttributeError: can't set attribute
>>> obj.__dict__['prop'] = 'foo' #
>>> vars(obj) #
{'prop': 'foo', 'attr': 'bar'}
>>> obj.prop #
'the prop value'
>>> Class.prop = 'baz' #
>>> obj.prop #
'foo'
{% endhighlight %}

-
{% highlight python %}
>>> obj.data #
'bar'
>>> Class.data #
'the class data attr'
>>> Class.data = property(lambda self: 'the "data" prop value')
>>> obj.data #
'the "data" prop value'
>>> del Class.data #
>>> obj.data #
'bar'
{% endhighlight %}

#### 프로퍼티 문서화

-
{% highlight python %}
weight = property(get_weight, set_weight, doc='weight in kilograms')
{% endhighlight %}

-
{% highlight python %}
class Foo:
    @property
    def bar(self):
        '''The bar attribute'''
        return self.__dict__['bar']

    @bar.setter
    def bar(self, value):
        self.__dict__['bar'] = value
{% endhighlight %}

<hr>
### 프로퍼티 팩토리 구현하기

-
{% highlight python %}
class LineItem:
    weight = quantity('weight')
    price = quantity('price')

    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price

    def subtotal(self):
        return self.weight * self.price
{% endhighlight %}

-
{% highlight python %}
weight = quantity('weight')
{% endhighlight %}

-
{% highlight python %}
def quantity(storage_name):

    def qty_getter(instance):
        return instance.__dict__[storage_name]

    def qty_setter(instance, value):
        if value > 0:
            instance.__dict__[storage_name] = value
        else:
            raise ValueError('value must be > 0')
    return property(qty_getter, qty_setter)
{% endhighlight %}

-
{% highlight python %}
>>> nutmeg = LineItem('Moluccan nutmeg', 8, 13.95)
>>> nutmeg.weight, nutmeg.price
(8, 13.95)
>>> sorted(vars(nutmeg).items())
[('description', 'Moluccan nutmeg'), ('price', 13.95), ('weight', 8)]
{% endhighlight %}

<hr>
### 속성 제거 처리하기

-
{% highlight python %}
del my_object.an_attribute
{% endhighlight %}

-
{% highlight python %}
class BlackKnight:
    def __init__(self):
        self.members = ['an arm', 'another arm',
                        'a leg', 'another leg']
        self.phrases = ["'Tis but a scratch.",
                        "It's just a flesh wound.",
                        "I'm invincible!",
                        "All right, we'll call it a draw."]
    @property
    def member(self):
        print('next member is:')
        return self.members[0]

    @member.deleter
    def member(self):
        text = 'BLACK KNIGHT (loses {})\n-- {}'
        print(text.format(self.members.pop(0), self.phrases.pop(0)))
{% endhighlight %}

-
{% highlight python %}
>>> knight = BlackKnight()
>>> knight.member
next member is:
'an arm'
>>> del knight.member
BLACK KNIGHT (loses an arm)
-- 'Tis but a scratch.
>>> del knight.member
BLACK KNIGHT (loses another arm)
-- It's just a flesh wound.
>>> del knight.member
BLACK KNIGHT (loses a leg)
-- I'm invincible!
>>> del knight.member
BLACK KNIGHT (loses another leg)
-- All right, we'll call it a draw.
{% endhighlight %}

-
{% highlight python %}
member = property(member_getter, fdel=member_deleter)
{% endhighlight %}

<hr>
### 속성을 처리하는 핵심 속성 및 함수

#### 속성 처리에 영향을 주는 특별 속성

- __class__


- __dict__


- __slots__


#### 속성을 처리하는 내장 함수

- dir([object])

- getattr(object, name[, default])

- hasattr(object, name)

- setattr(object, name, value)

- vars([object])

#### 속성을 처리하는 특별 메서드 

- __delattr__(self, name)


- __dir__(self)


- __getattr__(self, name)


- __getattribute__(self, name)


- __gatattribute__ , and only when __gatattribute__ raises AttributeError . To


- __setattr__(self, name, value)



