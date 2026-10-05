import { RuleBasedExtractor } from '../RuleBasedExtractor';

const extract = (text: string) => new RuleBasedExtractor().extract(text);

describe('RuleBasedExtractor', () => {
  it.each([
    ['Selling my Suzuki Swift 2012, 25,000 ₪, Tel Aviv', 25000, 'ILS', 'Vehicles', 'Tel Aviv'],
    ['MacBook Air 13" like new, ₪3500, Haifa', 3500, 'ILS', 'Electronics', 'Haifa'],
    [
      'Wooden dining table for 8, 1200 NIS, pickup in Ramat Gan',
      1200,
      'ILS',
      'Furniture',
      'Ramat Gan',
    ],
    ['Mountain bike 29", $450, Jerusalem', 450, 'USD', 'Sports', 'Jerusalem'],
    ['Red high heels size 38, 150 shekels', 150, 'ILS', 'Fashion', null],
    ['Baby stroller, barely used, 900₪, Petah Tikva', 900, 'ILS', 'Kids', 'Petah Tikva'],
    ['Kia Picanto 2018 for 25k ₪', 25000, 'ILS', 'Vehicles', null],
    ['Harry Potter books, all 7, 120 ש"ח, באר שבע', 120, 'ILS', 'Books', 'Beersheba'],
    ['מוכר ספה תלת מושבית 1,500 ₪ בכפר סבא', 1500, 'ILS', 'Furniture', 'Kfar Saba'],
    ['אופניים לילד, 300 שקל, רעננה', 300, 'ILS', 'Sports', "Ra'anana"],
    ['מכונית טויוטה קורולה 2015, 45 אלף שח, חולון', 45000, 'ILS', 'Vehicles', 'Holon'],
    ['מקרר סמסונג במצב מצוין 2000 ש״ח בתל אביב', 2000, 'ILS', 'Home', 'Tel Aviv'],
    ['iPhone 13, 128GB, €500, in Eilat', 500, 'EUR', 'Electronics', 'Eilat'],
    ['Vintage film camera, 80 dollars', 80, 'USD', 'Electronics', null],
    ['Ceramic mug set #kitchen #home', null, null, 'Home', null],
    ['Giving away a lamp in Springfield', null, null, 'Home', 'Springfield'],
    ['Old stuff from the attic', null, null, null, null],
  ])('%s', (text, price, currency, category, location) => {
    expect(extract(text)).toMatchObject({ price, currency, category, location });
  });

  it('collects hashtags, including Hebrew ones', () => {
    expect(extract('Sofa #furniture #ספה for sale').hashtag).toBe('#furniture #ספה');
    expect(extract('no tags').hashtag).toBe('');
  });

  it('does not read a model year or size as a price', () => {
    expect(extract('Suzuki Swift 2012, Tel Aviv').price).toBeNull();
    expect(extract('Heels size 38').price).toBeNull();
  });
});
