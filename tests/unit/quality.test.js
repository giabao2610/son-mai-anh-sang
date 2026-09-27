import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVELS, LEVELS, budgetFor, isMobile, pickLevel } from '../../src/engine/quality.js';

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ tự xưng là Mac: chỉ phân biệt được nhờ màn hình cảm ứng.
  ipadOs: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
};

describe('mức chất lượng', () => {
  it('ba mức theo thứ tự từ cao xuống thấp; mức mặc định của xưởng chỉ có dpr', () => {
    expect(LEVELS).toEqual(['cao', 'vua', 'thap']);
    expect(DEFAULT_LEVELS).toEqual({ cao: { dpr: 2 }, vua: { dpr: 1.5 }, thap: { dpr: 1.25 } });
  });

  it('pickLevel theo bảng §10: WebGPU cao/vừa, WebGL2 vừa/thấp', () => {
    expect(pickLevel({ tier: 'webgpu', mobile: false })).toBe('cao');
    expect(pickLevel({ tier: 'webgpu', mobile: true })).toBe('vua');
    expect(pickLevel({ tier: 'webgl2', mobile: false })).toBe('vua');
    expect(pickLevel({ tier: 'webgl2', mobile: true })).toBe('thap');
  });

  it('pickLevel với tầng lạ thì ném lỗi (tầng tĩnh không bao giờ chọn mức)', () => {
    expect(() => pickLevel({ tier: 'static', mobile: false })).toThrow('static');
  });
});

describe('isMobile', () => {
  it('Android và iPhone là điện thoại', () => {
    expect(isMobile({ userAgent: UA.android, maxTouchPoints: 5 })).toBe(true);
    expect(isMobile({ userAgent: UA.iphone, maxTouchPoints: 5 })).toBe(true);
  });

  it('iPadOS (UA Macintosh + cảm ứng) tính là điện thoại; Mac và Windows thì không', () => {
    expect(isMobile({ userAgent: UA.ipadOs, maxTouchPoints: 5 })).toBe(true);
    expect(isMobile({ userAgent: UA.mac, maxTouchPoints: 0 })).toBe(false);
    expect(isMobile({ userAgent: UA.windows, maxTouchPoints: 10 })).toBe(false);
  });

  it('thiếu thông tin thì coi là desktop', () => {
    expect(isMobile()).toBe(false);
    expect(isMobile({})).toBe(false);
  });
});

describe('budgetFor', () => {
  it('bức không khai báo quality → mức mặc định của xưởng', () => {
    expect(budgetFor('cao')).toEqual({ dpr: 2 });
    expect(budgetFor('thap', {})).toEqual({ dpr: 1.25 });
  });

  it('ghép số của bức lên mức mặc định, bức ghi đè được dpr', () => {
    const quality = { levels: { cao: { leaves: 1200, reflection: 0.5 }, vua: { dpr: 1.25, leaves: 800 } }, ladder: ['dpr'] };
    expect(budgetFor('cao', quality)).toEqual({ dpr: 2, leaves: 1200, reflection: 0.5 });
    expect(budgetFor('vua', quality)).toEqual({ dpr: 1.25, leaves: 800 });
    expect(budgetFor('thap', quality)).toEqual({ dpr: 1.25 });
  });

  it('trả object mới: sửa kết quả không làm hỏng mức mặc định', () => {
    const b = budgetFor('cao');
    b.dpr = 99;
    expect(DEFAULT_LEVELS.cao.dpr).toBe(2);
  });

  it('mức lạ thì ném lỗi', () => {
    expect(() => budgetFor('sieu')).toThrow('sieu');
  });
});
