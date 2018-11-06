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
{% highlight python %}
from collections import abc

class FrozenJSON:
    """A read-only façade for navigating a JSON-like object
        using attribute notation
    """

    def __new__(cls, arg):
        if isinstance(arg, abc.Mapping):
            return super().__new__(cls)
        elif isinstance(arg, abc.MutableSequence):
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
            return FrozenJSON(self.__data[name])
{% endhighlight %}

#### shelve를 이용해서 OSCON 피드 구조 변경하기
-
{% highlight python %}
>>> import shelve
>>> db = shelve.open(DB_NAME)
>>> if CONFERENCE not in db:
...     load_db(db)
...
>>> speaker = db['speaker.3471']
>>> type(speaker)
<class 'schedule1.Record'>
>>> speaker.name, speaker.twitter
('Anna Martelli Ravenscroft', 'annaraven')
>>> db.close()
{% endhighlight %}

-
{% highlight python %}
import warnings

import osconfeed

DB_NAME = 'data/schedule1_db'
CONFERENCE = 'conference.115'

class Record:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
    def load_db(db):
        raw_data = osconfeed.load()
        warnings.warn('loading ' + DB_NAME)
        for collection, rec_list in raw_data['Schedule'].items():
            record_type = collection[:-1]
            for record in rec_list:
                key = '{}.{}'.format(record_type, record['serial'])
                record['serial'] = key
                db[key] = Record(**record)
{% endhighlight %}

#### 프로퍼티를 이용해서 연결된 레코드 읽기
-
{% highlight python %}
>>> DbRecord.set_db(db)
>>> event = DbRecord.fetch('event.33950')
>>> event
<Event 'There *Will* Be Bugs'>
>>> event.venue
<DbRecord serial='venue.1449'>
>>> event.venue.name
'Portland 251'
>>> for spkr in event.speakers:
...     print('{0.serial}: {0.name}'.format(spkr))
...
speaker.3471: Anna Martelli Ravenscroft
speaker.5199: Alex Martelli
{% endhighlight %}

-
{% highlight python %}
import warnings
import inspect

import osconfeed

DB_NAME = 'data/schedule2_db'
CONFERENCE = 'conference.115'

class Record:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
    def __eq__(self, other):
        if isinstance(other, Record):
            return self.__dict__ == other.__dict__
        else:
            return NotImplemented
{% endhighlight %}

- Record

- DbRecord

- Event

-
{% highlight python %}
class MissingDatabaseError(RuntimeError):
    """Raised when a database is required but was not set."""

class DbRecord(Record):
    __db = None

    @staticmethod
    def set_db(db):
        DbRecord.__db = db

    @staticmethod
    def get_db():
        return DbRecord.__db

    @classmethod
    def fetch(cls, ident):
        db = cls.get_db()
        try:
            return db[ident]
        except TypeError:
            if db is None:
                msg = "database not set; call '{}.set_db(my_db)'"
                raise MissingDatabaseError(msg.format(cls.__name__))
            else:
                raise
     def __repr__(self):
         if hasattr(self, 'serial'):
             cls_name = self.__class__.__name__
             return '<{} serial={!r}>'.format(cls_name, self.serial)
         else:
             return super().__repr__()
{% endhighlight %}

-
{% highlight python %}
class Event(DbRecord):

    @property
     def venue(self):
         key = 'venue.{}'.format(self.venue_serial)
         return self.__class__.fetch(key)

    @property
    def speakers(self):
        if not hasattr(self, '_speaker_objs'):
            spkr_serials = self.__dict__['speakers']
            fetch = self.__class__.fetch
            self._speaker_objs = [fetch('speaker.{}'.format(key))
                                  for key in spkr_serials]
        return self._speaker_objs

    def __repr__(self):
        if hasattr(self, 'name'):
            cls_name = self.__class__.__name__
            return '<{} {!r}>'.format(cls_name, self.name)
        else:
            return super().__repr__()
{% endhighlight %}

-
{% highlight python %}
def load_db(db):
    raw_data = osconfeed.load()
    warnings.warn('loading ' + DB_NAME)
    for collection, rec_list in raw_data['Schedule'].items():
        record_type = collection[:-1]
        cls_name = record_type.capitalize()
        cls = globals().get(cls_name, DbRecord)
        if inspect.isclass(cls) and issubclass(cls, DbRecord):
            factory = cls
        else:
            factory = DbRecord
        for record in rec_list:
            key = '{}.{}'.format(record_type, record['serial'])
            record['serial'] = key
            db[key] = factory(**record)
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



